import { PrismaClient, UserRole } from "@prisma/client";

const db = new PrismaClient();

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

// 2 bots per district = 16 bots + 2 "all-districts" bots = 18 total
const bots = districts.flatMap((d, i) => [
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
]);

// Add 2 global bots
bots.push(
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
  }
);

async function main() {
  console.log("Seeding bot accounts...");

  for (const bot of bots) {
    const existing = await db.user.findFirst({
      where: { email: bot.email },
    });

    if (existing) {
      console.log(`  Skipping ${bot.email} (already exists)`);
      continue;
    }

    await db.user.create({
      data: {
        email: bot.email,
        name: bot.name,
        stateName: bot.stateName,
        bio: bot.bio,
        isBot: true,
        role: UserRole.USER,
        emailVerified: new Date(),
      },
    });
    console.log(`  Created ${bot.name} (${bot.email})`);
  }

  console.log(`Done! ${bots.length} bot accounts processed.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
