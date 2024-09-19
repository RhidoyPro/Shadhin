import { db } from "@/lib/db";

export const getAdminStats = async () => {
  const users = await db.user.count();
  const events = await db.event.count();
  const reports = await db.report.count();
  return { users, events, reports };
};
