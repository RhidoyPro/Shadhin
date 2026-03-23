import { db } from "@/lib/db";

type DailyCount = { date: string; count: number };

/**
 * Aggregate creation counts per day for a given model over the last N days.
 * Works with any model that has a `createdAt` field.
 */
async function dailyCounts(
  model: "user" | "event" | "like" | "comment" | "message",
  days: number
): Promise<DailyCount[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  // Prisma doesn't support date-trunc groupBy natively on MongoDB,
  // so we fetch raw dates and bucket client-side.
  let rows: { createdAt: Date }[];

  switch (model) {
    case "user":
      rows = await db.user.findMany({
        where: { createdAt: { gte: since }, isBot: false },
        select: { createdAt: true },
      });
      break;
    case "event":
      rows = await db.event.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      });
      break;
    case "like":
      rows = await db.like.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      });
      break;
    case "comment":
      rows = await db.comment.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      });
      break;
    case "message":
      rows = await db.message.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      });
      break;
  }

  // Bucket by date string (YYYY-MM-DD)
  const map = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    map.set(d.toISOString().slice(0, 10), 0);
  }
  for (const row of rows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    map.set(key, (map.get(key) || 0) + 1);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

export async function getAnalyticsData(days = 30) {
  const [
    signups,
    posts,
    likes,
    comments,
    messages,
    // Revenue
    ticketRequests,
    promotionRequests,
    orgRequests,
    // Totals for KPIs
    totalUsers,
    totalPosts,
    totalLikes,
    totalComments,
  ] = await Promise.all([
    dailyCounts("user", days),
    dailyCounts("event", days),
    dailyCounts("like", days),
    dailyCounts("comment", days),
    dailyCounts("message", days),
    // Revenue requests (approved)
    db.ticket.count({ where: { status: "APPROVED" } }),
    db.promotionRequest.count({ where: { status: "APPROVED" } }),
    db.orgVerificationRequest.count({ where: { status: "APPROVED" } }),
    // KPIs
    db.user.count({ where: { isBot: false } }),
    db.event.count(),
    db.like.count(),
    db.comment.count(),
  ]);

  // Compute cumulative signups
  let cumulative = 0;
  const cumulativeSignups = signups.map((d: DailyCount) => {
    cumulative += d.count;
    return { date: d.date, count: cumulative };
  });

  // Merge engagement into single series for combined chart
  const engagement = signups.map((_: DailyCount, i: number) => ({
    date: signups[i].date,
    likes: likes[i].count,
    comments: comments[i].count,
    messages: messages[i].count,
  }));

  return {
    signups,
    cumulativeSignups,
    posts,
    engagement,
    revenue: {
      tickets: ticketRequests,
      promotions: promotionRequests,
      orgBadges: orgRequests,
    },
    kpis: {
      totalUsers,
      totalPosts,
      totalLikes,
      totalComments,
    },
  };
}
