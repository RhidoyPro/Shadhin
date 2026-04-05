import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

// One-off: delete bot posts created in the last N minutes (test cleanup).
export async function GET(req: Request) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const url = new URL(req.url);
  const minutes = Number(url.searchParams.get("minutes") ?? "120");
  const dryRun = url.searchParams.get("dryRun") === "true";
  const since = new Date(Date.now() - minutes * 60 * 1000);

  // Find bot post IDs in window. Double filter: createdAt gte + isBot:true.
  const posts = await db.event.findMany({
    where: {
      createdAt: { gte: since },
      user: { isBot: true },
    },
    select: {
      id: true,
      mediaUrl: true,
      createdAt: true,
      content: true,
      user: { select: { name: true, isBot: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Hard safety: double-check every match has isBot:true.
  const safe = posts.filter((p) => p.user?.isBot === true);
  const ids = safe.map((p) => p.id);

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      wouldDelete: ids.length,
      windowMinutes: minutes,
      sample: safe.slice(0, 5).map((p) => ({
        id: p.id,
        name: p.user?.name,
        content: p.content.slice(0, 60),
        hasMedia: !!p.mediaUrl,
        createdAt: p.createdAt,
      })),
    });
  }

  if (ids.length === 0) {
    return NextResponse.json({ deleted: 0, windowMinutes: minutes });
  }

  // Delete dependent rows that don't cascade on MongoDB (belt + suspenders).
  await db.notification.deleteMany({ where: { eventId: { in: ids } } });
  await db.comment.deleteMany({ where: { eventId: { in: ids } } });
  await db.like.deleteMany({ where: { eventId: { in: ids } } });
  await db.bookmark.deleteMany({ where: { eventId: { in: ids } } });
  await db.eventAttendee.deleteMany({ where: { eventId: { in: ids } } });
  await db.report.deleteMany({ where: { eventId: { in: ids } } });

  const result = await db.event.deleteMany({ where: { id: { in: ids } } });

  return NextResponse.json({
    deleted: result.count,
    windowMinutes: minutes,
    mediaUrlsOrphaned: safe.filter((p) => p.mediaUrl).length,
  });
}
