"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export const addNewReport = async (eventId: string, reportReason: string) => {
  const session = await auth();

  if (!session) {
    return {
      error: "User not authenticated",
    };
  }

  if (!reportReason || reportReason.trim() === "") {
    return {
      error: "Report reason cannot be empty",
    };
  }

  // Save the report to the database
  await db.report.create({
    data: {
      reason: reportReason,
      userId: session.user.id!,
      eventId,
    },
  });

  return {
    success: true,
  };
};
