import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
import { getRankedEventsByState } from "@/data/events";
import { transformEventForMobile } from "@/lib/api-transform";
import { db } from "@/lib/db";
import { EventStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const limited = await rateLimit(`api-feed-read:${ip}`, { limit: 60, windowSeconds: 60 });
  if (limited.limited) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const user = await authenticateRequest(req);
  const { searchParams } = req.nextUrl;

  const state = searchParams.get("state") || "all-districts";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));

  const events = await getRankedEventsByState(state, user?.userId, page, limit) ?? [];

  const eventIds = events.map((e: any) => e.id);

  // Batch-fetch user-specific data for all events in one go
  let likedEventIds = new Set<string>();
  let attendingEventIds = new Set<string>();
  let bookmarkedIds = new Set<string>();

  if (user) {
    const [likes, attendees, bookmarks] = await Promise.all([
      db.like.findMany({
        where: { userId: user.userId, eventId: { in: eventIds } },
        select: { eventId: true },
      }),
      db.eventAttendee.findMany({
        where: { userId: user.userId, eventId: { in: eventIds }, status: EventStatus.GOING },
        select: { eventId: true },
      }),
      db.bookmark.findMany({
        where: { userId: user.userId, eventId: { in: eventIds } },
        select: { eventId: true },
      }),
    ]);
    likedEventIds = new Set(likes.map((l) => l.eventId));
    attendingEventIds = new Set(attendees.map((a) => a.eventId));
    bookmarkedIds = new Set(bookmarks.map((b) => b.eventId));
  }

  const transformed = events.map((event: any) => {
    return transformEventForMobile(event, {
      isLiked: likedEventIds.has(event.id),
      isAttending: attendingEventIds.has(event.id),
      isBookmarked: bookmarkedIds.has(event.id),
    });
  });

  return NextResponse.json({
    events: transformed,
    hasMore: events.length === limit,
    page,
  });
}
