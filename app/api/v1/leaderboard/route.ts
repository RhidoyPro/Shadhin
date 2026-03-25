import { NextRequest, NextResponse } from "next/server";
import { getAllUsersWithPointsPaginated } from "@/data/user";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "10")));

  const users = await getAllUsersWithPointsPaginated(page, limit);

  return NextResponse.json({ users, hasMore: users.length === limit });
}
