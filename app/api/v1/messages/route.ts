import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
import { getMessagesByStateName } from "@/data/messages";
import { db } from "@/lib/db";
import { moderateText } from "@/lib/moderation";
import { invalidateMessageCache } from "@/lib/cache";
import BangladeshStates from "@/data/bangladesh-states";

export const dynamic = "force-dynamic";

const VALID_SLUGS = BangladeshStates.map((s) => s.slug);

export async function GET(req: NextRequest) {
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

  const message = await db.message.create({
    data: { message: body.message, stateName: body.stateName, userId: user.userId },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  await invalidateMessageCache(body.stateName);

  return NextResponse.json({ message }, { status: 201 });
}
