import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: commentId } = await params;
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const limited = await rateLimit(`api-report:${user.userId}`, { limit: 5, windowSeconds: 300 });
  if (limited.limited) return NextResponse.json({ error: "Too many reports" }, { status: 429 });

  const body = await req.json().catch(() => null);
  if (!body?.reason || body.reason.length > 500) {
    return NextResponse.json({ error: "Reason required (max 500 chars)" }, { status: 400 });
  }

  const comment = await db.comment.findUnique({ where: { id: commentId }, select: { id: true } });
  if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

  const existing = await db.report.findFirst({ where: { commentId, userId: user.userId } });
  if (existing) return NextResponse.json({ error: "Already reported" }, { status: 409 });

  await db.report.create({ data: { commentId, userId: user.userId, reason: body.reason } });

  return NextResponse.json({ success: true }, { status: 201 });
}
