import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import NudgeEmail from "@/emails/NudgeEmail";

let _resend: Resend | null = null;
const getResend = () => {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
};

/**
 * Welcome sequence cron — runs daily at 6am UTC (12pm BD time)
 *
 * Day 3: Send nudge email to users who signed up 3 days ago with 0 posts
 * (Day 0 welcome email is sent inline during signup)
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Day 3 nudge: users created 3 days ago with 0 events
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const threeDaysAgoStart = new Date(threeDaysAgo.setHours(0, 0, 0, 0));
  const threeDaysAgoEnd = new Date(threeDaysAgo.setHours(23, 59, 59, 999));

  const nudgeUsers = await db.user.findMany({
    where: {
      createdAt: { gte: threeDaysAgoStart, lte: threeDaysAgoEnd },
      emailVerified: { not: null },
      events: { none: {} },
    },
    select: { email: true, name: true, stateName: true },
  });

  let nudgeSent = 0;
  for (const user of nudgeUsers) {
    if (!user.email) continue;
    try {
      await getResend().emails.send({
        from: "Shadhin.io <help@shadhin.io>",
        to: user.email,
        subject: "Have you tried posting on Shadhin.io?",
        react: NudgeEmail({
          name: user.name || "there",
          stateName: user.stateName || "your-district",
        }),
      });
      nudgeSent++;
    } catch {
      // Continue with next user
    }
  }

  return NextResponse.json({
    success: true,
    nudgeSent,
  });
}
