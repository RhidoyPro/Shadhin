import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const districts = [
  { name: "Dhaka", slug: "dhaka" },
  { name: "Chattogram", slug: "chattogram" },
  { name: "Khulna", slug: "khulna" },
  { name: "Rajshahi", slug: "rajshahi" },
  { name: "Sylhet", slug: "sylhet" },
  { name: "Barishal", slug: "barishal" },
  { name: "Rangpur", slug: "rangpur" },
  { name: "Mymensingh", slug: "mymensingh" },
];

const bots = [
  ...districts.flatMap((d) => [
    {
      email: `bot-${d.slug}-1@shadhin.io`,
      name: `${d.name} Community`,
      stateName: d.slug,
      bio: `Sharing updates from ${d.name} 🇧🇩`,
    },
    {
      email: `bot-${d.slug}-2@shadhin.io`,
      name: `${d.name} Pulse`,
      stateName: d.slug,
      bio: `What's happening in ${d.name} today`,
    },
  ]),
  {
    email: "bot-all-1@shadhin.io",
    name: "Shadhin Bangladesh",
    stateName: "all-districts",
    bio: "Daily stories from across Bangladesh 🇧🇩",
  },
  {
    email: "bot-all-2@shadhin.io",
    name: "BD Today",
    stateName: "all-districts",
    bio: "Your daily dose of Bangladeshi community news",
  },
];

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let created = 0;
  let skipped = 0;

  for (const bot of bots) {
    const existing = await db.user.findFirst({ where: { email: bot.email } });
    if (existing) {
      skipped++;
      continue;
    }
    await db.user.create({
      data: {
        ...bot,
        isBot: true,
      },
    });
    created++;
  }

  return NextResponse.json({ success: true, created, skipped, total: bots.length });
}
