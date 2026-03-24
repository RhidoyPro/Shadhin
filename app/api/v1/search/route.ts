import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
import { searchUsersAndEvents } from "@/data/user";

export async function GET(req: NextRequest) {
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const limited = await rateLimit(`api-search:${user.userId}`, { limit: 20, windowSeconds: 60 });
  if (limited.limited) {
    return NextResponse.json({ error: "Too fast" }, { status: 429 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim().slice(0, 100);
  if (!q || q.length < 2) {
    return NextResponse.json({ users: [], events: [] });
  }

  const results = await searchUsersAndEvents(q);
  return NextResponse.json(results);
}
