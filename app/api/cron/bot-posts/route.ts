import { db } from "@/lib/db";
import { EventType } from "@prisma/client";
import { NextResponse } from "next/server";

// Bangla search terms per district for headline matching
const DISTRICT_TERMS: Record<string, string[]> = {
  dhaka: ["ঢাকা", "রাজধানী", "মেট্রোরেল", "ডিএমপি"],
  chattogram: ["চট্টগ্রাম", "বন্দর", "কর্ণফুলী", "পার্বত্য"],
  sylhet: ["সিলেট", "হাওর", "সুনামগঞ্জ", "চা বাগান"],
  rajshahi: ["রাজশাহী", "পদ্মা", "বরেন্দ্র", "নওগাঁ"],
  khulna: ["খুলনা", "সুন্দরবন", "মংলা", "বাগেরহাট"],
  barishal: ["বরিশাল", "ভোলা", "পটুয়াখালী", "দক্ষিণাঞ্চল"],
  rangpur: ["রংপুর", "তিস্তা", "দিনাজপুর", "কুড়িগ্রাম"],
  mymensingh: ["ময়মনসিংহ", "ব্রহ্মপুত্র", "নেত্রকোনা", "শেরপুর"],
};

// All feeds tested and confirmed working — fetched in parallel
const RSS_FEEDS = [
  // Bangla — general / political
  "https://www.prothomalo.com/stories.rss",
  "https://www.banglatribune.com/feed/",
  "https://www.ittefaq.com.bd/feed/",
  "https://www.kalerkantho.com/rss.xml",
  "https://www.deshrupantor.com/feed/",
  // English — general
  "https://www.thedailystar.net/rss.xml",
  // Business / economy
  "https://www.tbsnews.net/rss.xml",
  // Sports
  "https://www.thedailystar.net/taxonomy/term/3/rss.xml",
  // Entertainment
  "https://www.thedailystar.net/taxonomy/term/283449/rss.xml",
  "https://www.thedailystar.net/arts-entertainment/rss.xml",
  "https://www.channelionline.com/feed/",
  // Technology
  "https://www.thedailystar.net/tech-startup/rss.xml",
  // Health
  "https://www.thedailystar.net/health/rss.xml",
  // Crime / justice
  "https://www.thedailystar.net/crime/rss.xml",
  // Environment / climate
  "https://www.thedailystar.net/environment/rss.xml",
  // International / South Asia
  "https://www.thedailystar.net/world/south-asia/rss.xml",
  // Education / campus
  "https://www.thedailystar.net/campus/rss.xml",
  // Agriculture / rural
  "https://www.thedailystar.net/country/rss.xml",
  // Lifestyle
  "https://www.thedailystar.net/lifestyle/rss.xml",
  // Opinion / analysis
  "https://www.thedailystar.net/opinion/rss.xml",
];

// Fetch and parse RSS headlines from all feeds in parallel
async function fetchHeadlines(): Promise<string[]> {
  const results = await Promise.allSettled(
    RSS_FEEDS.map((url) =>
      fetch(url, {
        signal: AbortSignal.timeout(3000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Shadhin/1.0)" },
      }).then((r) => (r.ok ? r.text() : ""))
    )
  );

  const headlines: string[] = [];

  for (const result of results) {
    if (result.status !== "fulfilled" || !result.value) continue;
    const xml = result.value;

    // Extract CDATA-wrapped titles (e.g. Prothom Alo)
    const cdata = Array.from(xml.matchAll(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/g));
    // Extract plain text titles (e.g. bdnews24)
    const plain = Array.from(xml.matchAll(/<title>([\s\S]*?)<\/title>/g));

    for (const m of cdata.concat(plain).slice(1)) {
      const title = m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
      // Skip empty, very short, or URL-like titles
      if (title.length > 20 && !title.startsWith("http")) {
        headlines.push(title);
      }
    }
  }

  return Array.from(new Set(headlines)); // deduplicate
}

// Pick a headline relevant to the bot's district, fallback to any headline
function pickHeadline(
  headlines: string[],
  stateName: string | null,
  used: Set<string>
): string | null {
  const available = headlines.filter((h) => !used.has(h));
  if (!available.length) return null;

  if (stateName && stateName !== "all-districts") {
    const terms = DISTRICT_TERMS[stateName] || [];
    const relevant = available.filter((h) => terms.some((t) => h.includes(t)));
    if (relevant.length > 0) {
      return relevant[Math.floor(Math.random() * relevant.length)];
    }
  }

  // Fallback: any available headline
  return available[Math.floor(Math.random() * available.length)];
}

// Wrap a raw headline into a discussion-style post
function toDiscussionPost(headline: string): string {
  const starters = [
    `"${headline}" — এ নিয়ে আপনার মতামত কী?`,
    `আজকের খবর: "${headline}" — কমেন্টে জানান আপনি কী ভাবছেন`,
    `"${headline}" — আপনার এলাকায় এর প্রভাব কেমন পড়ছে?`,
    `এই বিষয়ে আলোচনা হোক: "${headline}"`,
    `"${headline}" — সত্যিই কি এমন হচ্ছে? আপনারা কী দেখছেন?`,
  ];
  return starters[Math.floor(Math.random() * starters.length)];
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const force = new URL(req.url).searchParams.get("force") === "true";

  if (process.env.BOTS_ENABLED !== "true") {
    return NextResponse.json({ skipped: true, reason: "BOTS_ENABLED is not true" });
  }

  // Only post between 8am–9pm BD time (UTC+6), unless forced
  if (!force) {
    const bdHour = new Date(Date.now() + 6 * 60 * 60 * 1000).getUTCHours();
    if (bdHour < 8 || bdHour > 21) {
      return NextResponse.json({ skipped: true, reason: "Outside BD posting hours" });
    }
  }

  // Fetch news and bots in parallel
  const [headlines, bots] = await Promise.all([
    fetchHeadlines(),
    db.user.findMany({ where: { isBot: true } }),
  ]);

  if (bots.length === 0) {
    return NextResponse.json({ skipped: true, reason: "No bot accounts found" });
  }

  if (headlines.length === 0) {
    return NextResponse.json({ skipped: true, reason: "No headlines fetched from news feeds" });
  }

  // Batch check which bots already posted today (1 query instead of N)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysPosts = await db.event.findMany({
    where: {
      userId: { in: bots.map((b) => b.id) },
      createdAt: { gte: today },
    },
    select: { userId: true },
  });
  const alreadyPosted = new Set(todaysPosts.map((p) => p.userId));

  const usedHeadlines = new Set<string>();

  // Build list of bots to post for, picking headlines up front
  const postQueue: Array<{ bot: (typeof bots)[number]; content: string; stateName: string }> = [];
  for (const bot of bots) {
    if (!force && alreadyPosted.has(bot.id)) continue;
    if (!force && Math.random() > 0.5) continue; // ~50% chance per run
    const headline = pickHeadline(headlines, bot.stateName, usedHeadlines);
    if (!headline) continue;
    usedHeadlines.add(headline);
    postQueue.push({
      bot,
      content: toDiscussionPost(headline),
      stateName: bot.stateName || "all-districts",
    });
  }

  // Create all posts in parallel
  await Promise.all(
    postQueue.map(({ bot, content, stateName }) =>
      db.event.create({
        data: { content, eventType: EventType.STATUS, stateName, userId: bot.id },
      })
    )
  );
  const postsCreated = postQueue.length;

  // Bots like recent real user posts (40% chance)
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
    headlinesFetched: headlines.length,
  });
}
