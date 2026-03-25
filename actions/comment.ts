"use server";

import { auth } from "@/auth";
import { getCommentsByEventId } from "@/data/comments";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { moderateText } from "@/lib/moderation";
import { CommentSchema } from "@/utils/zodSchema";
import { sendPushToUser } from "@/lib/push";
import { invalidateFeedCache } from "@/lib/cache";
import { revalidatePath } from "next/cache";

export const addComment = async (eventId: string, content: string, mentionedUserIds?: string[]) => {
  const session = await auth();

  if (!session) {
    return { error: "User not authenticated" };
  }

  const limited = await rateLimit(`comment:${session.user.id}`, {
    limit: 20,
    windowSeconds: 60,
  });
  if (limited.limited) {
    return {
      error: `Too many comments. Please slow down.`,
    };
  }

  const validated = CommentSchema.safeParse({ content });
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  // Content moderation check
  const moderation = await moderateText(validated.data.content);
  if (moderation.flagged) {
    return { error: `Comment flagged for: ${moderation.categories.join(", ")}. Please revise.` };
  }

  const event = await db.event.findUnique({ where: { id: eventId } });

  if (!event) {
    return { error: "Event not found" };
  }

  const comment = await db.comment.create({
    data: {
      eventId,
      userId: session.user.id!,
      content: validated.data.content,
    },
  });

  // Push notification to post owner (non-blocking)
  if (event.userId !== session.user.id) {
    sendPushToUser(
      event.userId,
      "New comment!",
      `${session.user.name || "Someone"} commented on your post`,
      `/events/details/${eventId}`
    ).catch(() => {});
  }

  // Push to mentioned users
  if (mentionedUserIds?.length) {
    for (const mentionedId of mentionedUserIds) {
      if (mentionedId !== session.user.id && mentionedId !== event.userId) {
        sendPushToUser(mentionedId, "Mention", `${session.user.name} mentioned you in a comment`, `/events/details/${eventId}`).catch(() => {});
      }
    }
  }

  invalidateFeedCache(event.stateName).catch(() => {});
  revalidatePath("/events/details/[eventId]", "page");

  return { success: true, comment };
};

export const fetchEventComments = async (
  eventId: string,
  page?: number,
  limit?: number
) => {
  const comments = await getCommentsByEventId(eventId, page, limit);
  return comments;
};

export const deleteComment = async (commentId: string) => {
  const session = await auth();

  if (!session) {
    return { error: "User not authenticated" };
  }

  // Fetch event stateName for cache invalidation before deleting
  const comment = await db.comment.findUnique({
    where: { id: commentId },
    select: { event: { select: { stateName: true } } },
  });

  // Atomic ownership check + delete — avoids TOCTOU race condition
  try {
    await db.comment.delete({
      where: {
        id: commentId,
        userId: session.user.id!,
      },
    });
  } catch {
    return { error: "Comment not found or unauthorized" };
  }

  if (comment?.event?.stateName) {
    invalidateFeedCache(comment.event.stateName).catch(() => {});
  }
  revalidatePath("/events/details/[eventId]", "page");

  return { success: true };
};
