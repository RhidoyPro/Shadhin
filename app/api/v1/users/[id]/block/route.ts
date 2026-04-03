import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: targetUserId } = await params;
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const limited = await rateLimit(`api-block:${user.userId}`, { limit: 10, windowSeconds: 60 });
  if (limited.limited) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  if (targetUserId === user.userId) {
    return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await db.blockedUser.upsert({
    where: { blockerId_blockedUserId: { blockerId: user.userId, blockedUserId: targetUserId } },
    create: { blockerId: user.userId, blockedUserId: targetUserId },
    update: {},
  });

  return NextResponse.json({ blocked: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: targetUserId } = await params;
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const limited = await rateLimit(`api-unblock:${user.userId}`, { limit: 10, windowSeconds: 60 });
  if (limited.limited) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  await db.blockedUser.deleteMany({
    where: { blockerId: user.userId, blockedUserId: targetUserId },
  });

  return NextResponse.json({ blocked: false });
}
