import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, requireAuth, apiError } from "@/lib/api-auth";
import { getEventById } from "@/data/events";
import { getUserDataForEvent } from "@/actions/user";
import { db } from "@/lib/db";
import { moderateText } from "@/lib/moderation";
import { invalidateFeedCache } from "@/lib/cache";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "@/lib/s3";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await authenticateRequest(req);

  const event = await getEventById(id);
  if (!event) return apiError("Event not found", 404);

  let enriched: any = event;
  if (user) {
    const userData = await getUserDataForEvent(id, user.userId);
    enriched = { ...event, ...userData };
  }

  return NextResponse.json({ event: enriched });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const event = await db.event.findUnique({ where: { id }, select: { userId: true, stateName: true } });
  if (!event) return apiError("Event not found", 404);
  if (event.userId !== user.userId) return apiError("Not authorized", 403);

  const body = await req.json().catch(() => null);
  if (!body?.content) return apiError("Content is required", 400);
  if (body.content.length > 2000) return apiError("Content too long", 400);

  const moderation = await moderateText(body.content);
  if (moderation.flagged) return apiError("Content flagged for moderation", 400);

  const updated = await db.event.update({
    where: { id },
    data: { content: body.content },
    include: { user: { select: { id: true, name: true, image: true, isVerifiedOrg: true } } },
  });

  await invalidateFeedCache(event.stateName);

  return NextResponse.json({ event: updated });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const event = await db.event.findUnique({ where: { id }, select: { userId: true, stateName: true, mediaUrl: true } });
  if (!event) return apiError("Event not found", 404);
  if (event.userId !== user.userId) return apiError("Not authorized", 403);

  // Delete media from R2 if present
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
