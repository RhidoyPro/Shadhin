import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// One-time endpoint: rename all bots from generic names to journalist-style human names
// DELETE this file after running once.
const BOT_RENAMES: Record<string, { name: string; bio: string }> = {
  "bot-all-1@shadhin.io": {
    name: "Farhan Hossain",
    bio: "Senior correspondent covering national affairs across Bangladesh",
  },
  "bot-all-2@shadhin.io": {
    name: "Nusrat Jahan",
    bio: "Freelance journalist reporting on politics and society in Bangladesh",
  },
  "bot-dhaka-1@shadhin.io": {
    name: "Tanvir Ahmed",
    bio: "Dhaka-based reporter covering city politics and urban issues",
  },
  "bot-dhaka-2@shadhin.io": {
    name: "Sadia Islam",
    bio: "Journalist reporting on Dhaka's communities and local governance",
  },
  "bot-chattogram-1@shadhin.io": {
    name: "Rahim Chowdhury",
    bio: "Port city reporter covering trade, politics and Chattogram affairs",
  },
  "bot-chattogram-2@shadhin.io": {
    name: "Mitu Begum",
    bio: "Correspondent based in Chattogram covering community and development stories",
  },
  "bot-khulna-1@shadhin.io": {
    name: "Sabbir Khan",
    bio: "Khulna journalist covering the Sundarbans region and southern Bangladesh",
  },
  "bot-khulna-2@shadhin.io": {
    name: "Roksana Akter",
    bio: "Reporter covering Khulna's economy, climate and local politics",
  },
  "bot-rajshahi-1@shadhin.io": {
    name: "Masud Rana",
    bio: "Rajshahi correspondent focused on agriculture, education and Padma river issues",
  },
  "bot-rajshahi-2@shadhin.io": {
    name: "Sharmin Nahar",
    bio: "Journalist covering northwestern Bangladesh from Rajshahi",
  },
  "bot-sylhet-1@shadhin.io": {
    name: "Abul Kalam",
    bio: "Sylhet reporter covering haor regions, tea gardens and border affairs",
  },
  "bot-sylhet-2@shadhin.io": {
    name: "Surma Begum",
    bio: "Correspondent covering Sylhet's diaspora communities and local news",
  },
  "bot-barishal-1@shadhin.io": {
    name: "Karim Molla",
    bio: "Barishal journalist covering riverine communities and southern delta",
  },
  "bot-barishal-2@shadhin.io": {
    name: "Pushpa Das",
    bio: "Reporter covering Barishal, Bhola and the coastal districts",
  },
  "bot-rangpur-1@shadhin.io": {
    name: "Golam Mustafa",
    bio: "Rangpur correspondent reporting on Monga, Teesta and northern Bangladesh",
  },
  "bot-rangpur-2@shadhin.io": {
    name: "Parveen Sultana",
    bio: "Journalist covering Rangpur's agrarian communities and local politics",
  },
  "bot-mymensingh-1@shadhin.io": {
    name: "Ripon Sarker",
    bio: "Mymensingh reporter covering Brahmaputra basin and agricultural news",
  },
  "bot-mymensingh-2@shadhin.io": {
    name: "Monira Khatun",
    bio: "Correspondent covering Mymensingh, Netrokona and Sherpur districts",
  },
};

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await Promise.all(
    Object.entries(BOT_RENAMES).map(([email, { name, bio }]) =>
      db.user.updateMany({ where: { email }, data: { name, bio } })
    )
  );

  const updated = results.filter((r) => r.count > 0).length;
  const notFound = results.filter((r) => r.count === 0).length;

  return NextResponse.json({
    success: true,
    updated,
    notFound,
    total: Object.keys(BOT_RENAMES).length,
  });
}
