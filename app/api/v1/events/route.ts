import { NextResponse } from "next/server";
import { requireAuth, apiError } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { moderateText } from "@/lib/moderation";
import { invalidateFeedCache } from "@/lib/cache";
import BangladeshStates from "@/data/bangladesh-states";

const VALID_STATE_SLUGS = BangladeshStates.map((s) => s.slug);

export async function POST(req: Request) {
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const limited = await rateLimit(`api-create:${user.userId}`, { limit: 10, windowSeconds: 300 });
  if (limited.limited) {
    return NextResponse.json({ error: "Too many posts. Slow down." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.content || !body?.stateName) {
    return apiError("Content and stateName are required", 400);
  }

  if (body.content.length > 2000) return apiError("Content too long (max 2000)", 400);
  if (!VALID_STATE_SLUGS.includes(body.stateName) && body.stateName !== "all-districts") {
    return apiError("Invalid state", 400);
  }
  if (body.stateName === "all-districts" && user.role === "USER") {
    return apiError("Only admins can post to all districts", 403);
  }

  const moderation = await moderateText(body.content);
  if (moderation.flagged) {
    return apiError("Content flagged for moderation", 400);
  }

  const event = await db.event.create({
    data: {
      content: body.content,
      type: body.type || null,
      mediaUrl: body.mediaUrl || null,
      stateName: body.stateName,
      eventType: body.eventType || "STATUS",
      eventDate: body.eventDate ? new Date(body.eventDate) : null,
      ticketPrice: body.ticketPrice ? parseFloat(body.ticketPrice) : null,
      maxAttendees: body.maxAttendees ? parseInt(body.maxAttendees) : null,
      userId: user.userId,
    },
    include: { user: { select: { id: true, name: true, image: true, isVerifiedOrg: true } } },
  });

  await invalidateFeedCache(body.stateName);

  return NextResponse.json({ event }, { status: 201 });
}
