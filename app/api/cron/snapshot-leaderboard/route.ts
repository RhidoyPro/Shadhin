import { db } from "@/lib/db";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

// Called weekly by Vercel Cron to snapshot current points into previousPoints
// This powers the trend indicators on the leaderboard
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.user.updateMany({
    data: {
      previousPoints: {
        // MongoDB doesn't support field references in updateMany,
        // so we snapshot via a raw aggregate update
      },
    },
  });

  // MongoDB: use $set with field reference via runCommandRaw
  await (db as any).$runCommandRaw({
    update: "User",
    updates: [
      {
        q: {},
        u: [{ $set: { previousPoints: "$points" } }],
        multi: true,
      },
    ],
  });

  revalidateTag("leaderboard");
  return NextResponse.json({ success: true, snapshotAt: new Date().toISOString() });
}
