import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const limited = await rateLimit(`api-push-token:${user.userId}`, { limit: 10, windowSeconds: 60 });
  if (limited.limited) return NextResponse.json({ error: "Too fast" }, { status: 429 });

  const body = await req.json().catch(() => null);
  if (!body?.token || !/^ExponentPushToken\[[a-zA-Z0-9\-_]+\]$/.test(body.token)) {
    return NextResponse.json({ error: "Invalid Expo push token" }, { status: 400 });
  }

  // Upsert: if token exists, update userId (device may switch accounts)
  await db.expoPushToken.upsert({
    where: { token: body.token },
    update: { userId: user.userId },
    create: { token: body.token, userId: user.userId },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const delLimit = await rateLimit(`api-push-token-del:${user.userId}`, { limit: 10, windowSeconds: 60 });
  if (delLimit.limited) return NextResponse.json({ error: "Too fast" }, { status: 429 });

  const body = await req.json().catch(() => null);
  if (!body?.token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  await db.expoPushToken.deleteMany({ where: { token: body.token, userId: user.userId } });

  return NextResponse.json({ success: true });
}
