import { db } from "@/lib/db";
import { EventType } from "@prisma/client";
import { NextResponse } from "next/server";

// Bengali community post templates — bots pick randomly
const POST_TEMPLATES = [
  "আজকে আবহাওয়া কেমন আপনার এলাকায়? ☀️🌧️",
  "সকালের নাস্তায় কী খেলেন? আমাদের জানান! 🍳",
  "আপনার এলাকার সবচেয়ে সুন্দর জায়গা কোনটা? 📸",
  "এই সপ্তাহে কোন ইভেন্ট আছে আপনার এলাকায়?",
  "আজকের দিনটা কেমন কাটছে? শেয়ার করুন! 😊",
  "আপনার প্রিয় স্ট্রিট ফুড কোনটা? 🍢",
  "আপনার এলাকায় নতুন কী হচ্ছে? আমাদের জানান!",
  "সবাইকে শুভ সন্ধ্যা! আজকে কী করলেন? 🌆",
  "আপনার এলাকার কোন সমস্যা সমাধান দরকার? আলোচনা করি!",
  "বাংলাদেশের সেরা চা কোথায় পাওয়া যায়? ☕",
  "আজকে কোন ভালো খবর আছে? শেয়ার করুন! 🎉",
  "আপনার এলাকায় সেরা রেস্টুরেন্ট কোনটা? 🍽️",
  "সপ্তাহান্তে কী প্ল্যান? আমাদের জানান! 🗓️",
  "আপনার এলাকার ঐতিহ্য নিয়ে কিছু বলুন 🏛️",
  "নতুন কেউ এলাকায় এসেছেন? স্বাগতম জানাই! 👋",
  "আজকে কোন ম্যাচ দেখবেন? ⚽🏏",
  "আপনার পছন্দের বই কোনটা? পড়ার পরামর্শ দিন 📚",
  "বৃষ্টির দিনে কী করতে ভালো লাগে? 🌧️",
  "আপনার এলাকায় ফ্রিল্যান্সিং করেন কেউ? কানেক্ট হই! 💻",
  "শুভ সকাল! আজকের লক্ষ্য কী? 🌅",
];

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Kill switch
  if (process.env.BOTS_ENABLED !== "true") {
    return NextResponse.json({ skipped: true, reason: "BOTS_ENABLED is not true" });
  }

  // Get current BD time (UTC+6)
  const bdHour = new Date(Date.now() + 6 * 60 * 60 * 1000).getUTCHours();

  // Only post between 8am-9pm BD time
  if (bdHour < 8 || bdHour > 21) {
    return NextResponse.json({ skipped: true, reason: "Outside BD posting hours" });
  }

  const bots = await db.user.findMany({
    where: { isBot: true },
  });

  if (bots.length === 0) {
    return NextResponse.json({ skipped: true, reason: "No bot accounts found" });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let postsCreated = 0;

  for (const bot of bots) {
    // Check if bot already posted today
    const todaysPost = await db.event.findFirst({
      where: {
        userId: bot.id,
        createdAt: { gte: today },
      },
    });

    if (todaysPost) continue;

    // ~50% chance of posting each cron run (creates natural variation)
    if (Math.random() > 0.5) continue;

    const template = POST_TEMPLATES[Math.floor(Math.random() * POST_TEMPLATES.length)];

    await db.event.create({
      data: {
        content: template,
        eventType: EventType.STATUS,
        stateName: bot.stateName || "dhaka",
        userId: bot.id,
      },
    });

    postsCreated++;
  }

  // Occasionally have bots like recent real user posts
  if (Math.random() > 0.6) {
    const recentPosts = await db.event.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        user: { isBot: false },
      },
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    for (const post of recentPosts) {
      const randomBot = bots[Math.floor(Math.random() * bots.length)];
      const existingLike = await db.like.findFirst({
        where: { eventId: post.id, userId: randomBot.id },
      });
      if (!existingLike) {
        await db.like.create({
          data: { eventId: post.id, userId: randomBot.id },
        });
      }
    }
  }

  return NextResponse.json({
    success: true,
    postsCreated,
    botsTotal: bots.length,
  });
}
