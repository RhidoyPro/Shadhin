import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { invalidateFeedCache } from "@/lib/cache";
import { sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const limited = await rateLimit(`api-like:${user.userId}`, { limit: 30, windowSeconds: 60 });
  if (limited.limited) {
    return NextResponse.json({ error: "Too fast" }, { status: 429 });
  }

  const event = await db.event.findUnique({ where: { id: eventId }, select: { userId: true, stateName: true } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const existing = await db.like.findFirst({ where: { eventId, userId: user.userId } });

  if (existing) {
    await db.like.delete({ where: { id: existing.id } });
    await invalidateFeedCache(event.stateName);
    return NextResponse.json({ liked: false });
  }

  await db.like.create({ data: { eventId, userId: user.userId } });
  await invalidateFeedCache(event.stateName);

  // Push notification to post owner (non-blocking, rate-limited per target)
  if (event.userId !== user.userId) {
    const notifLimited = await rateLimit(`notif-like:${event.userId}`, { limit: 10, windowSeconds: 60 });
    if (!notifLimited.limited) {
      sendPushToUser(event.userId, "New Like", "Someone liked your post", `/events/details/${eventId}`).catch(() => {});
    }
  }

  return NextResponse.json({ liked: true });
}
