import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
import { transformEventForMobile } from "@/lib/api-transform";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const limited = await rateLimit(`api-search:${user.userId}`, { limit: 20, windowSeconds: 60 });
  if (limited.limited) {
    return NextResponse.json({ error: "Too fast" }, { status: 429 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim().slice(0, 100);
  if (!q || q.length < 2) {
    return NextResponse.json({ users: [], events: [] });
  }

  const [users, events] = await Promise.all([
    db.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { university: { contains: q, mode: "insensitive" } },
          { stateName: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        image: true,
        stateName: true,
        university: true,
        role: true,
        isVerifiedOrg: true,
      },
      take: 10,
    }),
    db.event.findMany({
      where: {
        content: { contains: q, mode: "insensitive" },
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, image: true, isVerifiedOrg: true, isBot: true } },
        likes: { select: { id: true } },
        comments: { select: { id: true } },
        attendees: { where: { status: "GOING" }, select: { id: true } },
      },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    users,
    events: events.map((event) => transformEventForMobile(event)),
  });
}
