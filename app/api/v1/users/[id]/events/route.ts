import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { transformEventForMobile } from "@/lib/api-transform";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(req);
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "10")));
  const skip = (page - 1) * limit;

  const events = await db.event.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
    include: {
      user: { select: { id: true, name: true, image: true, isVerifiedOrg: true, isBot: true } },
      likes: { select: { id: true, userId: true } },
      comments: { select: { id: true } },
      attendees: { where: { status: "GOING" }, select: { id: true } },
    },
  });

  // Check bookmarks if authenticated
  let bookmarkedIds = new Set<string>();
  if (user) {
    const bookmarks = await db.bookmark.findMany({
      where: { userId: user.userId, eventId: { in: events.map((e) => e.id) } },
      select: { eventId: true },
    });
    bookmarkedIds = new Set(bookmarks.map((b) => b.eventId));
  }

  const transformed = events.map((event) =>
    transformEventForMobile(event, {
      isLiked: user ? event.likes.some((l) => l.userId === user.userId) : false,
      isBookmarked: bookmarkedIds.has(event.id),
    })
  );

  return NextResponse.json({ events: transformed, hasMore: events.length === limit });
}
