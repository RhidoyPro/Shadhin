"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdminLevel } from "@/lib/roles";

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

  return { success: true };
};
