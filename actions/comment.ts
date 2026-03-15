"use server";

import { auth } from "@/auth";
import { getCommentsByEventId } from "@/data/comments";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { CommentSchema } from "@/utils/zodSchema";
import { revalidatePath } from "next/cache";

export const addComment = async (eventId: string, content: string) => {
  const session = await auth();

  if (!session) {
    return { error: "User not authenticated" };
  }

  const limited = rateLimit(`comment:${session.user.id}`, {
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

  revalidatePath("/events/details/[eventId]", "page");

  return { success: true };
};
