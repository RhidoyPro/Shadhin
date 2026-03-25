"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { saltAndHash } from "@/utils/helper";
import bcrypt from "bcryptjs";

export const changePassword = async (
  currentPassword: string | undefined,
  newPassword: string
) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const limited = await rateLimit(`change-pw:${session.user.id}`, {
    limit: 5,
    windowSeconds: 300,
  });
  if (limited.limited) {
    return { error: "Too many attempts. Please try again later." };
  }

  if (!newPassword || newPassword.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  if (newPassword.length > 128) {
    return { error: "Password too long" };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { hashedPassword: true },
  });

  if (!user) return { error: "User not found" };

  // If user has existing password, verify current password
  if (user.hashedPassword) {
    if (!currentPassword) {
      return { error: "Current password is required" };
    }
    const isMatch = bcrypt.compareSync(currentPassword, user.hashedPassword);
    if (!isMatch) {
      return { error: "Current password is incorrect" };
    }
  }

  const hashedPassword = saltAndHash(newPassword);

  await db.user.update({
    where: { id: session.user.id },
    data: { hashedPassword, passwordChangedAt: new Date() },
  });

  // passwordChangedAt invalidates all previously issued JWTs in requireAuth().
  // Client should still re-authenticate for UX consistency.
  return { success: true, message: "Password updated successfully", requireRelogin: true };
};

export const deleteOwnAccount = async () => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const limited = await rateLimit(`delete-account:${session.user.id}`, {
    limit: 3,
    windowSeconds: 300,
  });
  if (limited.limited) {
    return { error: "Too many attempts. Please try again later." };
  }

  try {
    await db.user.delete({
      where: { id: session.user.id },
    });

    return { success: true };
  } catch {
    return { error: "Failed to delete account" };
  }
};
