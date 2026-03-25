import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
import { getMessagesByStateName } from "@/data/messages";
import { db } from "@/lib/db";
import { moderateText } from "@/lib/moderation";
import { invalidateMessageCache } from "@/lib/cache";
import { sendPushToUser } from "@/lib/push";
import BangladeshStates from "@/data/bangladesh-states";

export const dynamic = "force-dynamic";

const VALID_SLUGS = BangladeshStates.map((s) => s.slug);

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const limited = await rateLimit(`api-msg-read:${ip}`, { limit: 60, windowSeconds: 60 });
  if (limited.limited) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const state = req.nextUrl.searchParams.get("state") || "all-districts";
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "20")));

  const messages = await getMessagesByStateName(state, page, limit);
  return NextResponse.json({ messages });
}

export async function POST(req: Request) {
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const limited = await rateLimit(`api-msg:${user.userId}`, { limit: 15, windowSeconds: 60 });
  if (limited.limited) {
    return NextResponse.json({ error: "Too fast" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.message || !body?.stateName) {
    return NextResponse.json({ error: "Message and stateName required" }, { status: 400 });
  }
  if (body.message.length > 500) {
    return NextResponse.json({ error: "Message too long (max 500)" }, { status: 400 });
  }
  if (!VALID_SLUGS.includes(body.stateName) && body.stateName !== "all-districts") {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  const moderation = await moderateText(body.message);
  if (moderation.flagged) {
    return NextResponse.json({ error: "Message flagged" }, { status: 400 });
  }

  const replyToId = body.replyToId || null;
  const mentionedUserIds: string[] = Array.isArray(body.mentionedUserIds) ? body.mentionedUserIds : [];

  const message = await db.message.create({
    data: {
      message: body.message,
      stateName: body.stateName,
      userId: user.userId,
      ...(replyToId && { replyToId }),
    },
    include: { user: { select: { id: true, name: true, image: true, isVerifiedOrg: true } } },
  });

  await invalidateMessageCache(body.stateName);

  // Send push to the user being replied to
  if (replyToId) {
    const original = await db.message.findUnique({ where: { id: replyToId }, select: { userId: true } });
    if (original && original.userId !== user.userId) {
      sendPushToUser(original.userId, "Reply", `${message.user.name} replied to your message`).catch(() => {});
    }
  }

  // Send push to mentioned users
  for (const mentionedId of mentionedUserIds) {
    if (mentionedId !== user.userId) {
      sendPushToUser(mentionedId, "Mention", `${message.user.name} mentioned you in chat`).catch(() => {});
    }
  }

  return NextResponse.json({ message }, { status: 201 });
}
