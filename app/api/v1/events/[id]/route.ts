import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, requireAuth, apiError } from "@/lib/api-auth";
import { getEventById } from "@/data/events";
import { getUserDataForEvent } from "@/actions/user";
import { transformEventForMobile } from "@/lib/api-transform";
import { db } from "@/lib/db";
import { moderateText } from "@/lib/moderation";
import { invalidateFeedCache } from "@/lib/cache";
import { rateLimit } from "@/lib/rate-limit";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/s3";
import { sanitizeBody } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(req);

  const event = await getEventById(id);
  if (!event) return apiError("Event not found", 404);

  let isLiked = false;
  let isAttending = false;
  let isBookmarked = false;

  if (user) {
    const userData = await getUserDataForEvent(id, user.userId);
    isLiked = userData.isLikedByUser;
    isAttending = userData.isUserAttending;

    const bookmark = await db.bookmark.findUnique({
      where: { userId_eventId: { userId: user.userId, eventId: id } },
    });
    isBookmarked = !!bookmark;
  }

  return NextResponse.json({
    event: transformEventForMobile(event, { isLiked, isAttending, isBookmarked }),
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const patchLimit = await rateLimit(`api-event-edit:${user.userId}`, { limit: 10, windowSeconds: 60 });
  if (patchLimit.limited) {
    return NextResponse.json({ error: "Too fast" }, { status: 429 });
  }

  const event = await db.event.findUnique({ where: { id }, select: { userId: true, stateName: true } });
  if (!event) return apiError("Event not found", 404);
  if (event.userId !== user.userId) return apiError("Not authorized", 403);

  const rawBody = await req.json().catch(() => null);
  const body = rawBody ? sanitizeBody(rawBody) : null;
  if (!body?.content) return apiError("Content is required", 400);
  if (body.content.length > 2000) return apiError("Content too long", 400);

  const moderation = await moderateText(body.content);
  if (moderation.flagged) return apiError("Content flagged for moderation", 400);

  const updated = await db.event.update({
    where: { id },
    data: { content: body.content },
    include: {
      user: { select: { id: true, name: true, image: true, isVerifiedOrg: true, isBot: true } },
      likes: { select: { id: true } },
      comments: { select: { id: true } },
      attendees: { where: { status: "GOING" }, select: { id: true } },
    },
  });

  await invalidateFeedCache(event.stateName);

  return NextResponse.json({ event: transformEventForMobile(updated) });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const deleteLimit = await rateLimit(`api-event-del:${user.userId}`, { limit: 10, windowSeconds: 60 });
  if (deleteLimit.limited) {
    return NextResponse.json({ error: "Too fast" }, { status: 429 });
  }

  const event = await db.event.findUnique({ where: { id }, select: { userId: true, stateName: true, mediaUrl: true } });
  if (!event) return apiError("Event not found", 404);
  if (event.userId !== user.userId) return apiError("Not authorized", 403);

  if (event.mediaUrl) {
    const key = event.mediaUrl.split("/").pop();
    if (key) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: process.env.AWS_BUCKET_NAME!, Key: key }));
      } catch {}
    }
  }

  await db.event.delete({ where: { id } });
  await invalidateFeedCache(event.stateName);

  return NextResponse.json({ success: true });
}
