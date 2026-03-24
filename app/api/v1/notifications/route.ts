import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getUserNotifications } from "@/data/notifications";

export async function GET(req: Request) {
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const notifications = await getUserNotifications(user.userId);
  return NextResponse.json({ notifications });
}
