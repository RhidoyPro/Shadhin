import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";

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

function botAvatar(seed: string): string {
  return `https://api.dicebear.com/9.x/notionists/png?seed=${encodeURIComponent(seed)}&radius=50&size=200`;
}

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
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const bot of bots) {
    const avatar = botAvatar(bot.email);
    const existing = await db.user.findFirst({ where: { email: bot.email } });

    if (existing) {
      // Update avatar if missing
      if (!existing.image) {
        await db.user.update({ where: { id: existing.id }, data: { image: avatar } });
        updated++;
      } else {
        skipped++;
      }
      continue;
    }

    await db.user.create({
      data: {
        ...bot,
        isBot: true,
        image: avatar,
      },
    });
    created++;
  }

  return NextResponse.json({ success: true, created, updated, skipped, total: bots.length });
}
