import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const limited = await rateLimit(`api-report:${user.userId}`, { limit: 5, windowSeconds: 300 });
  if (limited.limited) {
    return NextResponse.json({ error: "Too many reports" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.reason || body.reason.length > 500) {
    return NextResponse.json({ error: "Reason required (max 500 chars)" }, { status: 400 });
  }

  const event = await db.event.findUnique({ where: { id: eventId }, select: { id: true } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // Prevent duplicate
  const existing = await db.report.findFirst({ where: { eventId, userId: user.userId } });
  if (existing) return NextResponse.json({ error: "Already reported" }, { status: 409 });

  await db.report.create({ data: { eventId, userId: user.userId, reason: body.reason } });

  return NextResponse.json({ success: true }, { status: 201 });
}
