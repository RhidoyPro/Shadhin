import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const stateName = searchParams.get("stateName");
  const after = searchParams.get("after"); // ISO timestamp cursor

  if (!stateName) {
    return NextResponse.json({ error: "stateName required" }, { status: 400 });
  }

  const messages = await db.message.findMany({
    where: {
      stateName,
      ...(after ? { createdAt: { gt: new Date(after) } } : {}),
    },
    include: {
      user: {
        select: { id: true, name: true, image: true, isVerifiedOrg: true },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  // Batch-load reply targets
  const replyIds = messages.map((m) => m.replyToId).filter((id): id is string => !!id);
  let replyMap: Record<string, { id: string; message: string; user: { id: string; name: string } }> = {};
  if (replyIds.length > 0) {
    const uniqueIds = Array.from(new Set(replyIds));
    const replyMessages = await db.message.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, message: true, user: { select: { id: true, name: true } } },
    });
    for (const rm of replyMessages) {
      replyMap[rm.id] = rm;
    }
  }

  const enriched = messages.map((m) => ({
    ...m,
    replyTo: m.replyToId ? replyMap[m.replyToId] || null : null,
  }));

  return NextResponse.json(enriched);
}
