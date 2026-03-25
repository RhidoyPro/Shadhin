import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

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
          user: { select: { id: true, name: true, image: true, isVerifiedOrg: true } },
          likes: { select: { id: true } },
          comments: { select: { id: true } },
          attendees: { where: { status: "GOING" }, select: { id: true } },
        },
      },
    },
  });

  const events = bookmarks.map((b) => b.event);

  return NextResponse.json({ events, hasMore: events.length === limit });
}
