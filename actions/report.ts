"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const addNewReport = async (eventId: string, reportReason: string) => {
  const session = await auth();

  if (!session) {
    return { error: "User not authenticated" };
  }

  const limited = await rateLimit(`report:${session.user.id}`, {
    limit: 5,
    windowSeconds: 300,
  });
  if (limited.limited) {
    return { error: "Too many reports. Please try again later." };
  }

  if (!reportReason || reportReason.trim() === "") {
    return { error: "Report reason cannot be empty" };
  }

  if (reportReason.length > 500) {
    return { error: "Report reason cannot exceed 500 characters" };
  }

  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return { error: "Event not found" };
  }

  // Prevent duplicate reports from the same user for the same event
  const existingReport = await db.report.findFirst({
    where: { eventId, userId: session.user.id! },
  });
  if (existingReport) {
    return { error: "You have already reported this event" };
  }

  await db.report.create({
    data: {
      reason: reportReason.trim(),
      userId: session.user.id!,
      eventId,
    },
  });

  return { success: true };
};
