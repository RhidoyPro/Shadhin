import { NextRequest, NextResponse } from "next/server";
import { getUserEvents } from "@/data/events";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "10")));

  const events = await getUserEvents(id, page, limit);

  return NextResponse.json({ events, hasMore: events.length === limit });
}
