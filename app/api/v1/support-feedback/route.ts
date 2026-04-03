import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const limited = await rateLimit(`api-feedback:${ip}`, { limit: 10, windowSeconds: 60 });
  if (limited.limited) {
    return new NextResponse("<html><body><h2>Too many requests. Try again later.</h2></body></html>", {
      status: 429,
      headers: { "Content-Type": "text/html" },
    });
  }

  const id = req.nextUrl.searchParams.get("t");
  const rating = req.nextUrl.searchParams.get("r");

  if (!id || !rating || !["yes", "no"].includes(rating)) {
    return new NextResponse("<html><body><h2>Invalid request</h2></body></html>", {
      headers: { "Content-Type": "text/html" },
    });
  }

  try {
    await db.supportEmail.update({
      where: { id },
      data: { feedback: rating },
    });
  } catch {
    // Email not found or already rated — ignore
  }

  const message = rating === "yes"
    ? "Thank you! Glad we could help. 😊"
    : "Sorry we couldn't help. Our team will follow up soon.";

  const banglaMessage = rating === "yes"
    ? "ধন্যবাদ! আমরা সাহায্য করতে পেরে খুশি। 😊"
    : "দুঃখিত, আমরা সাহায্য করতে পারিনি। আমাদের টিম শীঘ্রই যোগাযোগ করবে।";

  return new NextResponse(
    `<html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Shadhin Support</title></head>
      <body style="font-family:system-ui;text-align:center;padding:60px 20px;background:#0D0D0D;color:#EDEDED">
        <h2>${message}</h2>
        <p style="color:#8C8C8C">${banglaMessage}</p>
        <p style="margin-top:30px"><a href="https://shadhin.io" style="color:#2D9F4F">← Back to Shadhin.io</a></p>
      </body>
    </html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
