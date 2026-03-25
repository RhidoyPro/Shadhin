import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getUserNotifications } from "@/data/notifications";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const limited = await rateLimit(`api-notif:${user.userId}`, { limit: 30, windowSeconds: 60 });
  if (limited.limited) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const notifications = await getUserNotifications(user.userId);
  return NextResponse.json({ notifications });
}
