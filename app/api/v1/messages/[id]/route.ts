import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { invalidateMessageCache } from "@/lib/cache";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let user;
  try {
    user = await requireAuth(req);
  } catch (e) {
    return e as Response;
  }

  const limited = await rateLimit(`api-msg-del:${user.userId}`, { limit: 30, windowSeconds: 60 });
  if (limited.limited) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const message = await db.message.findUnique({
    where: { id },
    select: { userId: true, stateName: true },
  });

  if (!message) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (message.userId !== user.userId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  await db.message.delete({ where: { id } });
  await invalidateMessageCache(message.stateName).catch(() => {});

  return NextResponse.json({ success: true });
}
