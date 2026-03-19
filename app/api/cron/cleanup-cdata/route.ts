import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * One-time cleanup: delete all bot posts with raw CDATA in content.
 * Safe to run multiple times (idempotent). Delete this route after use.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // MongoDB doesn't support Prisma `contains` with special regex chars like <![
  // so fetch all bot events and filter in JS
  const allBotEvents = await db.event.findMany({
    where: { user: { isBot: true } },
    select: { id: true, content: true },
  });
  const bad = allBotEvents.filter((e) => e.content.includes("<![CDATA["));

  if (bad.length === 0) {
    return NextResponse.json({ deleted: 0, message: "No CDATA posts found" });
  }

  await db.event.deleteMany({
    where: { id: { in: bad.map((e) => e.id) } },
  });

  return NextResponse.json({
    deleted: bad.length,
    posts: bad.map((e) => e.content.slice(0, 80)),
  });
}
