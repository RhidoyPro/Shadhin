import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { invalidateFeedCache } from "@/lib/cache";
import { sendPushToUser } from "@/lib/push";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const limited = await rateLimit(`api-attend:${user.userId}`, { limit: 15, windowSeconds: 60 });
  if (limited.limited) {
    return NextResponse.json({ error: "Too fast" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const status = body?.status; // "GOING" | "NOT_GOING" | "CANCEL"

  const event = await db.event.findUnique({ where: { id: eventId }, select: { userId: true, stateName: true } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const existing = await db.eventAttendee.findFirst({ where: { eventId, userId: user.userId } });

  if (status === "CANCEL" && existing) {
    // Remove attendance + deduct point if was GOING
    if (existing.status === "GOING") {
      await db.user.update({ where: { id: user.userId }, data: { points: { decrement: 1 } } });
      revalidateTag("leaderboard");
    }
    await db.eventAttendee.delete({ where: { id: existing.id } });
    await invalidateFeedCache(event.stateName);
    return NextResponse.json({ attending: null });
  }

  if (status === "GOING" || status === "NOT_GOING") {
    if (existing) {
      const wasGoing = existing.status === "GOING";
      await db.eventAttendee.update({ where: { id: existing.id }, data: { status } });
      // Adjust points
      if (status === "GOING" && !wasGoing) {
        await db.user.update({ where: { id: user.userId }, data: { points: { increment: 1 } } });
        revalidateTag("leaderboard");
      } else if (status !== "GOING" && wasGoing) {
        await db.user.update({ where: { id: user.userId }, data: { points: { decrement: 1 } } });
        revalidateTag("leaderboard");
      }
    } else {
      await db.eventAttendee.create({ data: { eventId, userId: user.userId, status } });
      if (status === "GOING") {
        await db.user.update({ where: { id: user.userId }, data: { points: { increment: 1 } } });
        revalidateTag("leaderboard");
        // Push to event creator
        if (event.userId !== user.userId) {
          sendPushToUser(event.userId, "New Attendee", "Someone is attending your event", `/events/details/${eventId}`).catch(() => {});
        }
      }
    }

    await invalidateFeedCache(event.stateName);
    return NextResponse.json({ attending: status });
  }

  return NextResponse.json({ error: "Invalid status. Use GOING, NOT_GOING, or CANCEL." }, { status: 400 });
}
