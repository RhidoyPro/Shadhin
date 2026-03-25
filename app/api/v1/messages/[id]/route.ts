import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { invalidateMessageCache } from "@/lib/cache";

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
