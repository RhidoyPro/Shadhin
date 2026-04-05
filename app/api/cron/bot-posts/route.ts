import { db } from "@/lib/db";
import { EventType } from "@prisma/client";
import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { fetchAndUploadImage, fetchAndUploadArticleImage } from "@/lib/bot-image";

interface FeedItem {
  title: string;
  link: string;
}

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

// District display names for Gemini prompts
const DISTRICT_NAMES: Record<string, string> = {
  dhaka: "Dhaka", chattogram: "Chattogram", sylhet: "Sylhet", rajshahi: "Rajshahi",
  khulna: "Khulna", barishal: "Barishal", rangpur: "Rangpur", mymensingh: "Mymensingh",
  "all-districts": "Bangladesh",
};

// General news feeds
const GENERAL_FEEDS = [
  "https://www.prothomalo.com/stories.rss",
  "https://www.banglatribune.com/feed/",
  "https://www.ittefaq.com.bd/feed/",
  "https://www.kalerkantho.com/rss.xml",
  "https://www.deshrupantor.com/feed/",
  "https://www.thedailystar.net/rss.xml",
  "https://www.tbsnews.net/rss.xml",
  "https://www.thedailystar.net/taxonomy/term/3/rss.xml",
  "https://www.thedailystar.net/taxonomy/term/283449/rss.xml",
  "https://www.thedailystar.net/tech-startup/rss.xml",
  "https://www.thedailystar.net/health/rss.xml",
  "https://www.thedailystar.net/environment/rss.xml",
  "https://www.thedailystar.net/country/rss.xml",
  "https://www.channelionline.com/feed/",
  "https://feeds.bbci.co.uk/bengali/rss.xml",
];

// District-specific Google News feeds (Bengali)
const DISTRICT_FEEDS: Record<string, string> = {
  dhaka: "https://news.google.com/rss/search?q=%E0%A6%A2%E0%A6%BE%E0%A6%95%E0%A6%BE&hl=bn&gl=BD&ceid=BD:bn",
  chattogram: "https://news.google.com/rss/search?q=%E0%A6%9A%E0%A6%9F%E0%A7%8D%E0%A6%9F%E0%A6%97%E0%A7%8D%E0%A6%B0%E0%A6%BE%E0%A6%AE&hl=bn&gl=BD&ceid=BD:bn",
  sylhet: "https://news.google.com/rss/search?q=%E0%A6%B8%E0%A6%BF%E0%A6%B2%E0%A7%87%E0%A6%9F&hl=bn&gl=BD&ceid=BD:bn",
  rajshahi: "https://news.google.com/rss/search?q=%E0%A6%B0%E0%A6%BE%E0%A6%9C%E0%A6%B6%E0%A6%BE%E0%A6%B9%E0%A7%80&hl=bn&gl=BD&ceid=BD:bn",
  khulna: "https://news.google.com/rss/search?q=%E0%A6%96%E0%A7%81%E0%A6%B2%E0%A6%A8%E0%A6%BE&hl=bn&gl=BD&ceid=BD:bn",
  barishal: "https://news.google.com/rss/search?q=%E0%A6%AC%E0%A6%B0%E0%A6%BF%E0%A6%B6%E0%A6%BE%E0%A6%B2&hl=bn&gl=BD&ceid=BD:bn",
  rangpur: "https://news.google.com/rss/search?q=%E0%A6%B0%E0%A6%82%E0%A6%AA%E0%A7%81%E0%A6%B0&hl=bn&gl=BD&ceid=BD:bn",
  mymensingh: "https://news.google.com/rss/search?q=%E0%A6%AE%E0%A7%9F%E0%A6%AE%E0%A6%A8%E0%A6%B8%E0%A6%BF%E0%A6%82%E0%A6%B9&hl=bn&gl=BD&ceid=BD:bn",
};

// ── Headline fetching ──

async function fetchRecentBotContent(): Promise<Set<string>> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentPosts = await db.event.findMany({
    where: { createdAt: { gte: sevenDaysAgo }, user: { isBot: true } },
    select: { content: true },
  });
  return new Set(recentPosts.map((p) => p.content.slice(0, 80)));
}

async function fetchFeedHeadlines(urls: string[]): Promise<FeedItem[]> {
  const results = await Promise.allSettled(
    urls.map((url) =>
      fetch(url, {
        signal: AbortSignal.timeout(4000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Shadhin/1.0)" },
      }).then((r) => (r.ok ? r.text() : ""))
    )
  );

  const items: FeedItem[] = [];
  const seen = new Set<string>();
  for (const result of results) {
    if (result.status !== "fulfilled" || !result.value) continue;
    const xml = result.value;
    // Split into <item> blocks and extract title + link from each.
    const itemBlocks = Array.from(xml.matchAll(/<item[\s>][\s\S]*?<\/item>/g));
    for (const block of itemBlocks) {
      const blockXml = block[0];
      const titleMatch =
        blockXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
        blockXml.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch =
        blockXml.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/) ||
        blockXml.match(/<link>([\s\S]*?)<\/link>/);
      if (!titleMatch || !linkMatch) continue;

      const title = titleMatch[1]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim();
      const link = linkMatch[1].trim();

      if (title.length <= 20 || title.startsWith("http") || title.startsWith("<![CDATA[")) continue;
      if (!link.startsWith("http")) continue;
      if (seen.has(title)) continue;
      seen.add(title);
      items.push({ title, link });
    }
  }
  return items;
}

function pickHeadline(headlines: FeedItem[], stateName: string | null, used: Set<string>): FeedItem | null {
  const available = headlines.filter((h) => !used.has(h.title));
  if (!available.length) return null;

  if (stateName && stateName !== "all-districts") {
    const terms = DISTRICT_TERMS[stateName] || [];
    const relevant = available.filter((h) => terms.some((t) => h.title.includes(t)));
    if (relevant.length > 0) return relevant[Math.floor(Math.random() * relevant.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}

// ── AI-powered post generation ──

const POST_STYLES = [
  "casual opinion",
  "question to community",
  "sharing news",
  "personal reaction",
  "calling for discussion",
];

async function generatePost(headline: string, district: string): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return fallbackPost(headline);

  const style = POST_STYLES[Math.floor(Math.random() * POST_STYLES.length)];
  const useBangla = Math.random() > 0.2; // 80% Bangla, 20% English
  const sentenceCount = Math.floor(Math.random() * 3) + 1; // 1-3 sentences
  const useEmoji = Math.random() > 0.4; // 60% chance

  const prompt = `You are a real person from ${district}, Bangladesh posting on a social media app.
Write a ${style} post about this news. ${useBangla ? "Write in Bangla (Bengali script)." : "Write in English."}
${sentenceCount} sentence${sentenceCount > 1 ? "s" : ""} max. Sound natural and human — like a real person sharing thoughts.
${useEmoji ? "Use 1-2 emoji naturally." : "No emoji."}
Do NOT use quotes. Do NOT copy the headline word-for-word. Do NOT start with "Breaking:" or news-style language.
Just write like a normal person would on social media.
Headline: "${headline}"`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 200, temperature: 0.9 },
        }),
        signal: AbortSignal.timeout(8000),
      }
    );
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text || fallbackPost(headline);
  } catch {
    return fallbackPost(headline);
  }
}

function fallbackPost(headline: string): string {
  const starters = [
    `"${headline}" — এ নিয়ে আপনার মতামত কী?`,
    `আজকের খবর: "${headline}" — কমেন্টে জানান আপনি কী ভাবছেন`,
    `"${headline}" — আপনার এলাকায় এর প্রভাব কেমন পড়ছে?`,
    `এই বিষয়ে আলোচনা হোক: "${headline}"`,
    `"${headline}" — সত্যিই কি এমন হচ্ছে? আপনারা কী দেখছেন?`,
  ];
  return starters[Math.floor(Math.random() * starters.length)];
}

// ── Bot commenting on user posts ──

async function botCommentOnUserPosts(bots: { id: string; stateName: string | null }[]) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return 0;

  const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const recentUserPosts = await db.event.findMany({
    where: { createdAt: { gte: since48h }, user: { isBot: false } },
    take: 10,
    orderBy: { createdAt: "desc" },
    select: { id: true, content: true, stateName: true },
  });

  if (!recentUserPosts.length) return 0;

  let commentsCreated = 0;

  for (const bot of bots) {
    if (Math.random() > 0.3) continue; // 30% chance per bot

    // Pick a post from the bot's district or any
    const post = recentUserPosts.find((p) => p.stateName === bot.stateName)
      || recentUserPosts[Math.floor(Math.random() * recentUserPosts.length)];

    // Check if bot already commented on this post
    const existing = await db.comment.findFirst({
      where: { eventId: post.id, userId: bot.id },
    });
    if (existing) continue;

    const district = DISTRICT_NAMES[bot.stateName || "all-districts"] || "Bangladesh";

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `You are a person from ${district}, Bangladesh. Write a short, friendly comment (1 sentence, max 15 words) on this social media post. Write in Bangla. Sound natural.\nPost: "${post.content.slice(0, 200)}"` }] }],
            generationConfig: { maxOutputTokens: 50, temperature: 0.9 },
          }),
          signal: AbortSignal.timeout(5000),
        }
      );
      const data = await res.json();
      const comment = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!comment) continue;

      await db.comment.create({
        data: { content: comment, eventId: post.id, userId: bot.id },
      });
      commentsCreated++;
    } catch {
      // Skip this comment on error
    }
  }
  return commentsCreated;
}

// ── Main cron handler ──

export async function GET(req: Request) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

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

  // Fetch data in parallel
  const [bots, recentContent] = await Promise.all([
    db.user.findMany({ where: { isBot: true } }),
    fetchRecentBotContent(),
  ]);

  if (bots.length === 0) {
    return NextResponse.json({ skipped: true, reason: "No bot accounts found" });
  }

  // Fetch general + district-specific headlines
  const districtFeedUrls = Object.values(DISTRICT_FEEDS);
  const allFeedUrls = [...GENERAL_FEEDS, ...districtFeedUrls];
  const headlines = await fetchFeedHeadlines(allFeedUrls);

  if (headlines.length === 0) {
    return NextResponse.json({ skipped: true, reason: "No headlines fetched" });
  }

  // Check which bots already posted today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysPosts = await db.event.findMany({
    where: { userId: { in: bots.map((b) => b.id) }, createdAt: { gte: today } },
    select: { userId: true },
  });
  const alreadyPosted = new Set(todaysPosts.map((p) => p.userId));

  const usedHeadlines = new Set<string>(recentContent);

  // Build post queue with AI-generated content + images.
  // Run all bots in parallel — 18 sequential Pexels+Gemini calls timed out
  // at 60s. Parallel fan-out completes in ~10-15s. Gemini free tier (5 RPM)
  // may rate-limit some calls, but generatePost already falls back to static
  // templates, and fetchAndUploadImage returns null on failure.
  let postsCreated = 0;
  let imagesAttached = 0;

  const postTasks = bots
    .filter((bot) => {
      if (!force && alreadyPosted.has(bot.id)) return false;
      if (!force && Math.random() > 0.5) return false; // ~50% chance per run
      return true;
    })
    .map((bot) => {
      const item = pickHeadline(headlines, bot.stateName, usedHeadlines);
      if (!item) return null;
      usedHeadlines.add(item.title);
      return { bot, item };
    })
    .filter((x): x is { bot: (typeof bots)[number]; item: FeedItem } => x !== null);

  const results = await Promise.allSettled(
    postTasks.map(async ({ bot, item }) => {
      const district = DISTRICT_NAMES[bot.stateName || "all-districts"] || "Bangladesh";
      // Fetch og:image from the real article URL first; fall back to Pexels
      // stock photo if the article has no og:image or scraping fails.
      const imagePromise = Math.random() > 0.3
        ? fetchAndUploadArticleImage(item.link).then((url) =>
            url ? url : fetchAndUploadImage(item.title)
          )
        : Promise.resolve(null);
      const [content, mediaUrl] = await Promise.all([
        generatePost(item.title, district),
        imagePromise,
      ]);
      await db.event.create({
        data: {
          content,
          eventType: EventType.STATUS,
          stateName: bot.stateName || "all-districts",
          userId: bot.id,
          ...(mediaUrl ? { mediaUrl, type: "image" } : {}),
        },
      });
      return { hasImage: !!mediaUrl };
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      postsCreated++;
      if (result.value.hasImage) imagesAttached++;
    }
  }

  // Bot engagement: liking + commenting
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [recentUserPosts, recentBotPosts] = await Promise.all([
    db.event.findMany({
      where: { createdAt: { gte: since24h }, user: { isBot: false } },
      take: 5, orderBy: { createdAt: "desc" }, select: { id: true },
    }),
    db.event.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) }, user: { isBot: true } },
      take: 10, orderBy: { createdAt: "desc" }, select: { id: true, userId: true },
    }),
  ]);

  // Liking
  const postsToMaybeLike = [
    ...recentUserPosts.map((p) => ({ id: p.id, ownerId: null })),
    ...recentBotPosts.filter(() => Math.random() > 0.4).map((p) => ({ id: p.id, ownerId: p.userId })),
  ];

  if (postsToMaybeLike.length > 0) {
    const existingLikes = await db.like.findMany({
      where: {
        eventId: { in: postsToMaybeLike.map((p) => p.id) },
        userId: { in: bots.map((b) => b.id) },
      },
      select: { eventId: true, userId: true },
    });
    const likedSet = new Set(existingLikes.map((l) => `${l.eventId}:${l.userId}`));

    await Promise.allSettled(
      postsToMaybeLike.map((post) => {
        const eligible = bots.filter((b) => b.id !== post.ownerId);
        if (!eligible.length) return Promise.resolve();
        const bot = eligible[Math.floor(Math.random() * eligible.length)];
        if (likedSet.has(`${post.id}:${bot.id}`)) return Promise.resolve();
        return db.like.create({ data: { eventId: post.id, userId: bot.id } });
      })
    );
  }

  // Commenting
  const commentsCreated = await botCommentOnUserPosts(bots);

  return NextResponse.json({
    success: true,
    postsCreated,
    imagesAttached,
    commentsCreated,
    botsTotal: bots.length,
    headlinesFetched: headlines.length,
  });
}
