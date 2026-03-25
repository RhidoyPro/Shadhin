import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import WeeklyDigestEmail from "@/emails/WeeklyDigestEmail";
import BangladeshStates from "@/data/bangladesh-states";
import { verifyCronAuth } from "@/lib/cron-auth";

let _resend: Resend | null = null;
const getResend = () => {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
};
const RECIPIENTS_PER_BATCH = 50;

/**
 * Weekly district digest — runs every Monday 3am UTC (9am BD time)
 * Sends personalized digest per user based on their stateName
 */
export async function GET(request: Request) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Get top posts per state
  const states = BangladeshStates.filter((s) => s.slug !== "all-districts");
  let totalSent = 0;

  for (const state of states) {
    // Top 3 events by like count this week (sorted by DB)
    const topEvents = await db.event.findMany({
      where: {
        stateName: state.slug,
        createdAt: { gte: oneWeekAgo },
      },
      include: { likes: { select: { id: true } } },
      orderBy: { likes: { _count: "desc" } },
      take: 3,
    });

    const sorted = topEvents.map((e) => ({
      id: e.id,
      content: e.content,
      likes: e.likes.length,
    }));

    const newUsersCount = await db.user.count({
      where: { stateName: state.slug, createdAt: { gte: oneWeekAgo } },
    });

    // Skip if nothing happened
    if (sorted.length === 0 && newUsersCount === 0) continue;

    // Get users in this state
    const users = await db.user.findMany({
      where: { stateName: state.slug, emailVerified: { not: null } },
      select: { email: true, name: true },
    });

    // Send in batches
    for (let i = 0; i < users.length; i += RECIPIENTS_PER_BATCH) {
      const batch = users.slice(i, i + RECIPIENTS_PER_BATCH);
      const emails = batch
        .filter((u) => u.email)
        .map((u) => ({
          from: "Shadhin.io <help@shadhin.io>" as const,
          to: u.email!,
          subject: `This week in ${state.name} — Shadhin.io`,
          react: WeeklyDigestEmail({
            name: u.name || "there",
            stateName: state.name,
            topEvents: sorted,
            newUsersCount,
          }),
        }));

      if (emails.length > 0) {
        try {
          await getResend().batch.send(emails);
          totalSent += emails.length;
        } catch {
          // Continue with next batch
        }
      }
    }
  }

  return NextResponse.json({ success: true, totalSent });
}
