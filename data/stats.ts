import { db } from "@/lib/db";

export const getAdminStats = async () => {
  const users = await db.user.count();
  const events = await db.event.count();
  const reports = await db.report.count();
  const pendingVerifications = await db.verificationToken.count();
  const pendingVerificationData = await db.verificationToken.findMany();
  const pendingVerificationsWithNoEmailSent = pendingVerificationData.filter(
    (verification) => !verification.isEmailSent
  ).length;
  const likes = await db.like.count();
  const comments = await db.comment.count();
  const attendees = await db.eventAttendee.count();
  const totalMessages = await db.message.count();
  return {
    users,
    events,
    reports,
    pendingVerifications,
    pendingVerificationsWithNoEmailSent,
    likes,
    comments,
    attendees,
    totalMessages,
  };
};
