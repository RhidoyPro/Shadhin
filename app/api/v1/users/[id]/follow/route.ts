import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { invalidateViewerContext } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: targetId } = await params;
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  if (user.userId === targetId) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  const limited = await rateLimit(`api-follow:${user.userId}`, { limit: 20, windowSeconds: 60 });
  if (limited.limited) {
    return NextResponse.json({ error: "Too fast" }, { status: 429 });
  }

  // Verify target user exists
  const targetUser = await db.user.findUnique({ where: { id: targetId }, select: { id: true } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existing = await db.follow.findFirst({
    where: { followerId: user.userId, followingId: targetId },
  });

  if (existing) {
    await db.follow.delete({ where: { id: existing.id } });
    await invalidateViewerContext(user.userId);
    return NextResponse.json({ following: false });
  }

  await db.follow.create({ data: { followerId: user.userId, followingId: targetId } });
  await invalidateViewerContext(user.userId);

  return NextResponse.json({ following: true });
}
