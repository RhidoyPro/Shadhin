import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getCommentsByEventId } from "@/data/comments";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { moderateText } from "@/lib/moderation";
import { invalidateFeedCache } from "@/lib/cache";
import { sendPushToUser } from "@/lib/push";
import { CommentSchema } from "@/utils/zodSchema";
import { sanitizeBody } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "10")));

  const comments = await getCommentsByEventId(eventId, page, limit) ?? [];

  return NextResponse.json({ comments, hasMore: comments.length === limit }, { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' } });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await params;
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const limited = await rateLimit(`api-comment:${user.userId}`, { limit: 20, windowSeconds: 60 });
  if (limited.limited) {
    return NextResponse.json({ error: "Too fast" }, { status: 429 });
  }

  const rawBody = await req.json().catch(() => null);
  const body = rawBody ? sanitizeBody(rawBody) : null;
  const parsed = CommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid comment" }, { status: 400 });
  }

  const event = await db.event.findUnique({ where: { id: eventId }, select: { userId: true, stateName: true } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const moderation = await moderateText(parsed.data.content);
  if (moderation.flagged) {
    return NextResponse.json({ error: "Comment flagged for moderation" }, { status: 400 });
  }

  const mentionedUserIds: string[] = Array.isArray(body?.mentionedUserIds)
    ? body.mentionedUserIds.filter((id: unknown): id is string => typeof id === "string" && /^[a-f0-9]{24}$/i.test(id)).slice(0, 10)
    : [];

  const comment = await db.comment.create({
    data: { content: parsed.data.content, eventId, userId: user.userId },
    include: { user: { select: { id: true, name: true, image: true, isVerifiedOrg: true } } },
  });

  await invalidateFeedCache(event.stateName);

  if (event.userId !== user.userId) {
    sendPushToUser(event.userId, "New Comment", `${comment.user.name} commented on your post`, `/events/details/${eventId}`).catch(() => {});
  }

  // Send push to mentioned users
  for (const mentionedId of mentionedUserIds) {
    if (mentionedId !== user.userId && mentionedId !== event.userId) {
      sendPushToUser(mentionedId, "Mention", `${comment.user.name} mentioned you in a comment`, `/events/details/${eventId}`).catch(() => {});
    }
  }

  return NextResponse.json({ comment }, { status: 201 });
}
