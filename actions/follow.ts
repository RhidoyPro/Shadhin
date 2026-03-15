"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { revalidateTag } from "next/cache";

export const toggleFollow = async (targetUserId: string) => {
  const session = await auth();

  if (!session) {
    return { error: "User not authenticated" };
  }

  if (session.user.id === targetUserId) {
    return { error: "Cannot follow yourself" };
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
    revalidatePath(`/user/${targetUserId}`);
    return { success: true, following: false };
  }

  await db.follow.create({
    data: {
      followerId: session.user.id!,
      followingId: targetUserId,
    },
  });

  revalidatePath(`/user/${targetUserId}`);
  return { success: true, following: true };
};
