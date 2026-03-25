import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const TIERS: Record<number, number> = { 3: 50, 7: 100, 14: 200 };

export async function POST(req: Request) {
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const limited = await rateLimit(`api-promotion:${user.userId}`, { limit: 5, windowSeconds: 60 });
  if (limited.limited) {
    return NextResponse.json({ error: "Too fast" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const bkashValid = /^[A-Za-z0-9]{6,20}$/.test(body?.bkashRef || "");
  if (!body?.eventId || !body?.durationDays || !bkashValid) {
    return NextResponse.json({ error: "eventId, durationDays, and valid bkashRef (6-20 alphanumeric) required" }, { status: 400 });
  }

  const amountBDT = TIERS[body.durationDays];
  if (!amountBDT) return NextResponse.json({ error: "Invalid duration (3, 7, or 14 days)" }, { status: 400 });

  const event = await db.event.findUnique({ where: { id: body.eventId }, select: { userId: true, isPromoted: true } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (event.userId !== user.userId) return NextResponse.json({ error: "Not your event" }, { status: 403 });
  if (event.isPromoted) return NextResponse.json({ error: "Already promoted" }, { status: 409 });

  const existing = await db.promotionRequest.findFirst({
    where: { eventId: body.eventId, status: "PENDING" },
  });
  if (existing) return NextResponse.json({ error: "Request already pending" }, { status: 409 });

  await db.promotionRequest.create({
    data: {
      eventId: body.eventId,
      userId: user.userId,
      durationDays: body.durationDays,
      amountBDT,
      bkashRef: body.bkashRef,
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
