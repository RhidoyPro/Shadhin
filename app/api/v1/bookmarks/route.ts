import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { transformEventForMobile } from "@/lib/api-transform";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const limited = await rateLimit(`api-bookmarks:${user.userId}`, { limit: 30, windowSeconds: 60 });
  if (limited.limited) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;

  const bookmarks = await db.bookmark.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
    include: {
      event: {
        include: {
          user: { select: { id: true, name: true, image: true, isVerifiedOrg: true, isBot: true } },
          likes: { select: { id: true } },
          comments: { select: { id: true } },
          attendees: { where: { status: "GOING" }, select: { id: true } },
        },
      },
    },
  });

  const events = bookmarks.map((b) =>
    transformEventForMobile(b.event, { isBookmarked: true })
  );

  return NextResponse.json({ events, hasMore: events.length === limit });
}
