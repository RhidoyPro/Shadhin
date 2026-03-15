"use server";

import { auth } from "@/auth";
import { getIsLikedByUser } from "@/data/like";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const like = async (eventId: string) => {
  const session = await auth();

  if (!session) {
    return { error: "User not authenticated" };
  }

  const limited = rateLimit(`like:${session.user.id}`, {
    limit: 30,
    windowSeconds: 60,
  });
  if (limited.limited) {
    return { error: "Too many actions. Please slow down." };
  }

  const event = await db.event.findUnique({ where: { id: eventId } });

  if (!event) {
    return { error: "Event not found" };
  }

  const existingLike = await db.like.findFirst({
    where: { eventId, userId: session.user.id! },
  });

  if (existingLike) {
    await db.like.delete({ where: { id: existingLike.id } });
    return { success: true };
  }

  await db.like.create({
    data: { eventId, userId: session.user.id! },
  });

  return { success: true };
};

export const isLikedByUser = async (eventId: string, userId: string) => {
  return await getIsLikedByUser(eventId, userId);
};
