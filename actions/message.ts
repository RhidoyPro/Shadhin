"use server";

import { auth } from "@/auth";
import { getMessagesByStateName } from "@/data/messages";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { moderateText } from "@/lib/moderation";
import { invalidateMessageCache } from "@/lib/cache";
import { sendPushToUser } from "@/lib/push";
import BangladeshStates from "@/data/bangladesh-states";

const VALID_SLUGS = new Set(
  BangladeshStates.filter((s) => s.slug !== "all-districts").map((s) => s.slug)
);
const NAME_TO_SLUG = new Map(
  BangladeshStates.filter((s) => s.slug !== "all-districts").map((s) => [s.name, s.slug])
);

export const addMessage = async (
  message: string,
  stateName: string,
  replyToId?: string,
  mentionedUserIds?: string[]
) => {
  const session = await auth();

  if (!session) {
    return { error: "User not authenticated" };
  }

  const limited = await rateLimit(`message:${session.user.id}`, {
    limit: 15,
    windowSeconds: 60,
  });
  if (limited.limited) {
    return { error: "Too many messages. Please slow down." };
  }

  if (!message || message.trim() === "") {
    return { error: "Message cannot be empty" };
  }

  if (message.length > 500) {
    return { error: "Message cannot exceed 500 characters" };
  }

  // Accept both slugs ("dhaka") and display names ("Dhaka") — normalize to slug
  let slug = stateName;
  if (!VALID_SLUGS.has(slug)) {
    const mapped = NAME_TO_SLUG.get(stateName);
    if (!mapped) return { error: "Invalid state" };
    slug = mapped;
  }

  // Content moderation check
  const moderation = await moderateText(message);
  if (moderation.flagged) {
    return { error: "Message flagged for inappropriate content. Please revise." };
  }

  const created = await db.message.create({
    data: {
      message: message.trim(),
      userId: session.user.id!,
      stateName: slug,
      ...(replyToId && { replyToId }),
    },
    include: { user: { select: { name: true } } },
  });

  invalidateMessageCache(slug).catch(() => {});

  // Push to replied-to user
  if (replyToId) {
    const original = await db.message.findUnique({ where: { id: replyToId }, select: { userId: true } });
    if (original && original.userId !== session.user.id) {
      sendPushToUser(original.userId, "Reply", `${created.user.name} replied to your message`).catch(() => {});
    }
  }

  // Push to mentioned users
  if (mentionedUserIds?.length) {
    for (const mentionedId of mentionedUserIds) {
      if (mentionedId !== session.user.id) {
        sendPushToUser(mentionedId, "Mention", `${created.user.name} mentioned you in chat`).catch(() => {});
      }
    }
  }

  return { success: true };
};

export const fetchMessages = async (
  stateName: string,
  page?: number,
  limit?: number
) => {
  const messages = await getMessagesByStateName(stateName, page, limit);
  return messages;
};
