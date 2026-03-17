import { db } from "@/lib/db";
import { sendLeaderboardAlertEmail } from "@/lib/mail";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

// Called weekly by Vercel Cron to snapshot current points into previousPoints
// This powers the trend indicators on the leaderboard
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get top 10 before snapshot (for comparison)
  const beforeTop10 = await db.user.findMany({
    orderBy: { points: "desc" },
    take: 10,
    select: { id: true, email: true, name: true, points: true },
  });
  const beforeRankMap = new Map(
    beforeTop10.map((u, i) => [u.id, { rank: i + 1, email: u.email, name: u.name, points: u.points }])
  );

  // Snapshot: copy points → previousPoints
  await (db as any).$runCommandRaw({
    update: "User",
    updates: [
      {
        q: {},
        u: [{ $set: { previousPoints: "$points" } }],
        multi: true,
      },
    ],
  });

  // Get top 10 after (same since points didn't change, but this runs weekly
  // so by next week the comparison will be meaningful)
  const afterTop10 = await db.user.findMany({
    orderBy: { points: "desc" },
    take: 10,
    select: { id: true, email: true, name: true, points: true },
  });

  // Send alerts to users who were in top 5 but dropped out, or whose rank changed significantly
  let alertsSent = 0;
  for (let i = 0; i < afterTop10.length; i++) {
    const user = afterTop10[i];
    const currentRank = i + 1;
    const before = beforeRankMap.get(user.id);
    const previousRank = before?.rank;

    // Alert if rank changed by 2+ positions
    if (previousRank && Math.abs(currentRank - previousRank) >= 2 && user.email) {
      try {
        await sendLeaderboardAlertEmail(user.email, {
          name: user.name || "User",
          previousRank,
          currentRank,
          points: user.points,
        });
        alertsSent++;
      } catch {
        // Non-critical, skip
      }
    }
  }

  // Also alert users who dropped out of top 10
  for (const [userId, data] of Array.from(beforeRankMap.entries())) {
    const stillInTop10 = afterTop10.some((u) => u.id === userId);
    if (!stillInTop10 && data.email) {
      try {
        await sendLeaderboardAlertEmail(data.email, {
          name: data.name || "User",
          previousRank: data.rank,
          currentRank: 11, // approximate
          points: data.points,
        });
        alertsSent++;
      } catch {
        // Non-critical, skip
      }
    }
  }

  revalidateTag("leaderboard");
  return NextResponse.json({
    success: true,
    snapshotAt: new Date().toISOString(),
    alertsSent,
  });
}
