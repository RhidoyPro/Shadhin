"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdminLevel } from "@/lib/roles";
import { logAdminAction } from "@/lib/audit";

/**
 * Add a strike to a user. Auto-suspends at 3 strikes for 7 days.
 */
export const addStrike = async (userId: string) => {
  const session = await auth();
  if (!session || !isAdminLevel(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found" };

  const newStrikes = user.strikes + 1;
  const shouldSuspend = newStrikes >= 3;

  await db.user.update({
    where: { id: userId },
    data: {
      strikes: newStrikes,
      ...(shouldSuspend && {
        isSuspended: true,
        suspendedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }),
    },
  });

  await logAdminAction({
    adminId: session.user.id!,
    action: "ADD_STRIKE",
    targetId: userId,
    targetType: "USER",
    details: `Strike ${newStrikes}/3${shouldSuspend ? " — auto-suspended 7 days" : ""}`,
  });

  return {
    success: true,
    strikes: newStrikes,
    suspended: shouldSuspend,
  };
};

/**
 * Suspend a user for a given number of days.
 */
export const suspendUser = async (userId: string, days: number = 7) => {
  const session = await auth();
  if (!session || !isAdminLevel(session.user.role)) {
    return { error: "Unauthorized" };
  }

  await db.user.update({
    where: { id: userId },
    data: {
      isSuspended: true,
      suspendedUntil: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    },
  });

  await logAdminAction({
    adminId: session.user.id!,
    action: "SUSPEND_USER",
    targetId: userId,
    targetType: "USER",
    details: `Suspended for ${days} days`,
  });

  return { success: true };
};

/**
 * Unsuspend a user.
 */
export const unsuspendUser = async (userId: string) => {
  const session = await auth();
  if (!session || !isAdminLevel(session.user.role)) {
    return { error: "Unauthorized" };
  }

  await db.user.update({
    where: { id: userId },
    data: {
      isSuspended: false,
      suspendedUntil: null,
      strikes: 0,
    },
  });

  await logAdminAction({
    adminId: session.user.id!,
    action: "UNSUSPEND_USER",
    targetId: userId,
    targetType: "USER",
  });

  return { success: true };
};

/**
 * Delete an event and add a strike to its creator.
 */
export const deleteEventAndStrike = async (eventId: string) => {
  const session = await auth();
  if (!session || !isAdminLevel(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) return { error: "Event not found" };

  // Delete the event
  await db.event.delete({ where: { id: eventId } });

  // Add strike to event creator
  const strikeResult = await addStrike(event.userId);

  await logAdminAction({
    adminId: session.user.id!,
    action: "DELETE_EVENT",
    targetId: eventId,
    targetType: "EVENT",
    details: `Deleted event and struck user ${event.userId}`,
  });

  return {
    success: true,
    strikeResult,
  };
};

/**
 * Dismiss a report (delete it without taking action).
 */
export const dismissReport = async (reportId: string) => {
  const session = await auth();
  if (!session || !isAdminLevel(session.user.role)) {
    return { error: "Unauthorized" };
  }

  await db.report.delete({ where: { id: reportId } });

  await logAdminAction({
    adminId: session.user.id!,
    action: "DISMISS_REPORT",
    targetId: reportId,
    targetType: "REPORT",
  });

  return { success: true };
};

/**
 * Toggle verified org status for a user.
 */
export const toggleVerifiedOrg = async (userId: string) => {
  const session = await auth();
  if (!session || !isAdminLevel(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const user = await db.user.findUnique({ where: { id: userId }, select: { isVerifiedOrg: true } });
  if (!user) return { error: "User not found" };

  const newValue = !user.isVerifiedOrg;
  await db.user.update({
    where: { id: userId },
    data: { isVerifiedOrg: newValue },
  });

  await logAdminAction({
    adminId: session.user.id!,
    action: "TOGGLE_VERIFIED_ORG",
    targetId: userId,
    targetType: "USER",
    details: newValue ? "Granted verified org badge" : "Revoked verified org badge",
  });

  return { success: true, isVerifiedOrg: newValue };
};

/**
 * Toggle promoted status for an event post.
 */
export const togglePromotedPost = async (eventId: string, durationDays: number = 7) => {
  const session = await auth();
  if (!session || !isAdminLevel(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const event = await db.event.findUnique({ where: { id: eventId }, select: { isPromoted: true } });
  if (!event) return { error: "Event not found" };

  const newValue = !event.isPromoted;
  await db.event.update({
    where: { id: eventId },
    data: {
      isPromoted: newValue,
      promotedUntil: newValue ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000) : null,
    },
  });

  await logAdminAction({
    adminId: session.user.id!,
    action: "TOGGLE_PROMOTED_POST",
    targetId: eventId,
    targetType: "EVENT",
    details: newValue ? `Promoted for ${durationDays} days` : "Removed promotion",
  });

  return { success: true, isPromoted: newValue };
};
