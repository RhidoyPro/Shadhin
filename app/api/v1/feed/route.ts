import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { getRankedEventsByState } from "@/data/events";
import { getUserDataForEvent } from "@/actions/user";

export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  const { searchParams } = req.nextUrl;

  const state = searchParams.get("state") || "all-districts";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));

  const events = await getRankedEventsByState(state, user?.userId, page, limit) ?? [];

  // Enrich with user interaction state if authenticated
  let enriched = events;
  if (user) {
    enriched = await Promise.all(
      events.map(async (event: any) => {
        const userData = await getUserDataForEvent(event.id, user.userId);
        return { ...event, ...userData };
      })
    );
  }

  return NextResponse.json({
    events: enriched,
    hasMore: events.length === limit,
    page,
  });
}
