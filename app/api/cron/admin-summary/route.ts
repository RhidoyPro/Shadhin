import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import AdminSummaryEmail from "@/emails/AdminSummaryEmail";
import { format } from "date-fns";
import { UserRole } from "@prisma/client";

let _resend: Resend | null = null;
const getResend = () => {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
};

/**
 * Admin daily summary — runs every day at 2am UTC (8am BD time)
 * Sends summary of last 24h activity to all admin users
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [newUsers, newPosts, newReports, newComments, newLikes] =
    await Promise.all([
      db.user.count({ where: { createdAt: { gte: oneDayAgo } } }),
      db.event.count({ where: { createdAt: { gte: oneDayAgo } } }),
      db.report.count({ where: { createdAt: { gte: oneDayAgo } } }),
      db.comment.count({ where: { createdAt: { gte: oneDayAgo } } }),
      db.like.count({ where: { createdAt: { gte: oneDayAgo } } }),
    ]);

  // Get admin emails
  const admins = await db.user.findMany({
    where: { role: UserRole.ADMIN },
    select: { email: true },
  });

  const dateStr = format(new Date(), "MMMM d, yyyy");

  for (const admin of admins) {
    if (!admin.email) continue;
    try {
      await getResend().emails.send({
        from: "Shadhin.io <help@shadhin.io>",
        to: admin.email,
        subject: `Admin Summary — ${dateStr}`,
        react: AdminSummaryEmail({
          date: dateStr,
          newUsers,
          newPosts,
          newReports,
          newComments,
          newLikes,
        }),
      });
    } catch {
      // Continue
    }
  }

  return NextResponse.json({
    success: true,
    stats: { newUsers, newPosts, newReports, newComments, newLikes },
  });
}
