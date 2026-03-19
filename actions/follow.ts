"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { invalidateViewerContext } from "@/lib/cache";
import { revalidatePath } from "next/cache";

export const toggleFollow = async (targetUserId: string) => {
  const session = await auth();

  if (!session) {
    return { error: "User not authenticated" };
  }

  if (session.user.id === targetUserId) {
    return { error: "Cannot follow yourself" };
  }

  const limited = await rateLimit(`follow:${session.user.id}`, {
    limit: 20,
    windowSeconds: 60,
  });
  if (limited.limited) {
    return { error: "Too many actions. Please slow down." };
  }

  const target = await db.user.findUnique({ where: { id: targetUserId } });
  if (!target) {
    return { error: "User not found" };
  }

  const existing = await db.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: session.user.id!,
        followingId: targetUserId,
      },
    },
  });

  if (existing) {
    await db.follow.delete({ where: { id: existing.id } });
    invalidateViewerContext(session.user.id!).catch(() => {});
    revalidatePath(`/user/${targetUserId}`);
    return { success: true, following: false };
  }

  await db.follow.create({
    data: {
      followerId: session.user.id!,
      followingId: targetUserId,
    },
  });

  invalidateViewerContext(session.user.id!).catch(() => {});
  revalidatePath(`/user/${targetUserId}`);
  return { success: true, following: true };
};
