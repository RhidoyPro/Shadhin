import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
import { getRankedEventsByState } from "@/data/events";
import { getUserDataForEvent } from "@/actions/user";
import { transformEventForMobile } from "@/lib/api-transform";
import { db } from "@/lib/db";

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

  // Get user's bookmarked event IDs
  let bookmarkedIds = new Set<string>();
  if (user) {
    const bookmarks = await db.bookmark.findMany({
      where: { userId: user.userId },
      select: { eventId: true },
    });
    bookmarkedIds = new Set(bookmarks.map((b) => b.eventId));
  }

  const transformed = await Promise.all(
    events.map(async (event: any) => {
      let isLiked = false;
      let isAttending = false;

      if (user) {
        const userData = await getUserDataForEvent(event.id, user.userId);
        isLiked = userData.isLikedByUser;
        isAttending = userData.isUserAttending;
      }

      return transformEventForMobile(event, {
        isLiked,
        isAttending,
        isBookmarked: bookmarkedIds.has(event.id),
      });
    })
  );

  return NextResponse.json({
    events: transformed,
    hasMore: events.length === limit,
    page,
  });
}
