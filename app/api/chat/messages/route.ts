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
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return NextResponse.json(messages);
}
