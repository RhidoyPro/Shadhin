import { NextResponse } from "next/server";
import { getUserByEmail } from "@/data/user";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { ResetEmailSchema } from "@/utils/zodSchema";
import { headers } from "next/headers";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const limited = await rateLimit(`api-forgot:${ip}`, { limit: 5, windowSeconds: 300 });
  if (limited.limited) {
    return NextResponse.json(
      { error: `Too many attempts. Retry in ${limited.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const parsed = ResetEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // Always return same message (don't reveal if email exists)
  const message = "If that email is registered, a reset code has been sent.";

  const user = await getUserByEmail(parsed.data.email);
  if (!user) return NextResponse.json({ message });

  // Generate 8-char hex code
  const code = crypto.randomBytes(4).toString("hex");
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Delete any existing codes for this email, then create a new one
  await db.forgotPasswordCode.deleteMany({
    where: { email: parsed.data.email },
  });
  await db.forgotPasswordCode.create({
    data: { email: parsed.data.email, code, expires },
  });

  // Send email with code (reuse existing mail function)
  const { sendForgotPasswordEmail } = await import("@/lib/mail");
  await sendForgotPasswordEmail(parsed.data.email, code);

  return NextResponse.json({ message });
}
