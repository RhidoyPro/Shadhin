import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const existing = await db.bookmark.findFirst({ where: { eventId, userId: user.userId } });

  if (existing) {
    await db.bookmark.delete({ where: { id: existing.id } });
    return NextResponse.json({ bookmarked: false });
  }

  await db.bookmark.create({ data: { eventId, userId: user.userId } });
  return NextResponse.json({ bookmarked: true });
}
