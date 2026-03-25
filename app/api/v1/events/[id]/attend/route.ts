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

  if (status === "CANCEL" || status === "GOING" || status === "NOT_GOING") {
    // Use transaction to prevent race conditions with points
    const result = await db.$transaction(async (tx) => {
      const existing = await tx.eventAttendee.findFirst({ where: { eventId, userId: user.userId } });

      if (status === "CANCEL") {
        if (!existing) return { attending: null };
        if (existing.status === "GOING") {
          await tx.user.update({ where: { id: user.userId }, data: { points: { decrement: 1 } } });
        }
        await tx.eventAttendee.delete({ where: { id: existing.id } });
        return { attending: null, pointsChanged: existing.status === "GOING" };
      }

      if (existing) {
        const wasGoing = existing.status === "GOING";
        await tx.eventAttendee.update({ where: { id: existing.id }, data: { status } });
        if (status === "GOING" && !wasGoing) {
          await tx.user.update({ where: { id: user.userId }, data: { points: { increment: 1 } } });
        } else if (status !== "GOING" && wasGoing) {
          await tx.user.update({ where: { id: user.userId }, data: { points: { decrement: 1 } } });
        }
        return { attending: status, pointsChanged: (status === "GOING") !== wasGoing };
      }

      await tx.eventAttendee.create({ data: { eventId, userId: user.userId, status } });
      if (status === "GOING") {
        await tx.user.update({ where: { id: user.userId }, data: { points: { increment: 1 } } });
      }
      return { attending: status, pointsChanged: status === "GOING", isNew: true };
    });

    if (result.pointsChanged) revalidateTag("leaderboard");
    await invalidateFeedCache(event.stateName);

    // Push notification outside transaction (non-blocking)
    if ((result as any).isNew && status === "GOING" && event.userId !== user.userId) {
      sendPushToUser(event.userId, "New Attendee", "Someone is attending your event", `/events/details/${eventId}`).catch(() => {});
    }

    return NextResponse.json({ attending: result.attending });
  }

  return NextResponse.json({ error: "Invalid status. Use GOING, NOT_GOING, or CANCEL." }, { status: 400 });
}
