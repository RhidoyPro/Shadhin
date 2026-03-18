"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdminLevel } from "@/lib/roles";
import { Resend } from "resend";
import BroadcastAnnouncementEmail from "@/emails/BroadcastAnnouncementEmail";

const RECIPIENTS_PER_EMAIL = 50;
const MAX_BATCH_SIZE = 100;

let _resend: Resend | null = null;
const getResend = () => {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
};

export const sendBroadcastAnnouncement = async (
  subject: string,
  message: string
) => {
  const session = await auth();

  if (!session?.user || !isAdminLevel(session.user.role)) {
    return { error: "Unauthorized" };
  }

  if (!subject.trim() || !message.trim()) {
    return { error: "Subject and message are required" };
  }

  if (subject.trim().length > 200) {
    return { error: "Subject must be under 200 characters" };
  }

  if (message.trim().length > 5000) {
    return { error: "Message must be under 5000 characters" };
  }

  const users = await db.user.findMany({
    where: {
      email: { not: null },
      emailVerified: { not: null },
      isSuspended: false,
      isBot: false,
    },
    select: { email: true },
  });

  const emails = users
    .map((u) => u.email)
    .filter((e): e is string => e !== null);

  if (emails.length === 0) {
    return { error: "No eligible recipients found" };
  }

  // Group emails into chunks of 50 recipients
  const emailGroups = emails.reduce((acc, email, i) => {
    const groupIndex = Math.floor(i / RECIPIENTS_PER_EMAIL);
    if (!acc[groupIndex]) {
      acc[groupIndex] = [];
    }
    acc[groupIndex].push(email);
    return acc;
  }, [] as string[][]);

  const emailData = emailGroups.map((group) => ({
    from: "Shadhin.io <help@shadhin.io>",
    to: group,
    subject: subject.trim(),
    react: BroadcastAnnouncementEmail({
      subject: subject.trim(),
      message: message.trim(),
    }),
  }));

  let sentCount = 0;
  let errorCount = 0;

  for (let i = 0; i < emailData.length; i += MAX_BATCH_SIZE) {
    const batch = emailData.slice(i, i + MAX_BATCH_SIZE);
    try {
      await getResend().batch.send(batch);
      sentCount += batch.reduce((sum, b) => sum + b.to.length, 0);
    } catch (error) {
      console.error(`Broadcast batch ${i / MAX_BATCH_SIZE + 1} failed:`, error);
      errorCount += batch.reduce((sum, b) => sum + b.to.length, 0);
    }
  }

  if (errorCount > 0 && sentCount === 0) {
    return { error: "Failed to send broadcast. Please try again." };
  }

  return {
    message: `Broadcast sent to ${sentCount} users${
      errorCount > 0 ? ` (${errorCount} failed)` : ""
    }.`,
  };
};
