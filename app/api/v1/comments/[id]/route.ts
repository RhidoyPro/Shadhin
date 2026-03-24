import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { invalidateFeedCache } from "@/lib/cache";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  // Find comment first to get event info for cache invalidation
  const comment = await db.comment.findUnique({
    where: { id },
    select: { userId: true, event: { select: { stateName: true } } },
  });

  if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  if (comment.userId !== user.userId) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  await db.comment.delete({ where: { id } });

  if (comment.event?.stateName) {
    await invalidateFeedCache(comment.event.stateName);
  }

  return NextResponse.json({ success: true });
}
