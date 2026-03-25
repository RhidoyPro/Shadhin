import { NextRequest, NextResponse } from "next/server";
import { getAllUsersWithPointsPaginated } from "@/data/user";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const limited = await rateLimit(`api-leaderboard:${ip}`, { limit: 30, windowSeconds: 60 });
  if (limited.limited) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "10")));

  const users = await getAllUsersWithPointsPaginated(page, limit);

  return NextResponse.json({ users, hasMore: users.length === limit });
}
