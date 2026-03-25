import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const BKASH_REF_REGEX = /^[A-Za-z0-9]{6,20}$/;

export async function POST(req: Request) {
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const limited = await rateLimit(`api-ticket:${user.userId}`, { limit: 5, windowSeconds: 60 });
  if (limited.limited) return NextResponse.json({ error: "Too fast" }, { status: 429 });

  const body = await req.json().catch(() => null);
  if (!body?.eventId || !body?.bkashRef || !BKASH_REF_REGEX.test(body.bkashRef)) {
    return NextResponse.json({ error: "eventId and valid bkashRef (6-20 alphanumeric chars) required" }, { status: 400 });
  }

  const event = await db.event.findUnique({
    where: { id: body.eventId },
    select: { ticketPrice: true, maxAttendees: true, userId: true },
  });
  if (!event || !event.ticketPrice) {
    return NextResponse.json({ error: "Event not found or not ticketed" }, { status: 404 });
  }

  // Check for existing pending ticket
  const existing = await db.ticket.findFirst({
    where: { eventId: body.eventId, userId: user.userId, status: "PENDING" },
  });
  if (existing) return NextResponse.json({ error: "Ticket request already pending" }, { status: 409 });

  // 5% platform fee
  const amountBDT = event.ticketPrice + event.ticketPrice * 0.05;

  await db.ticket.create({
    data: {
      eventId: body.eventId,
      userId: user.userId,
      bkashRef: body.bkashRef,
      amountBDT,
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
