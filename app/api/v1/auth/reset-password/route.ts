import { NextResponse } from "next/server";
import { getForgotPasswordCodeByCode } from "@/data/forgot-password";
import { getUserByEmail } from "@/data/user";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { saltAndHash } from "@/utils/helper";
import { ResetPasswordSchema } from "@/utils/zodSchema";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const limited = await rateLimit(`api-reset:${ip}`, { limit: 10, windowSeconds: 300 });
  if (limited.limited) {
    return NextResponse.json(
      { error: `Too many attempts. Retry in ${limited.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body?.code || !body?.password) {
    return NextResponse.json({ error: "Code and password are required" }, { status: 400 });
  }

  const code = body.code.trim().toUpperCase();
  if (!/^[0-9A-F]{8}$/.test(code)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const parsed = ResetPasswordSchema.safeParse({ password: body.password });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid password" },
      { status: 400 }
    );
  }

  const existingCode = await getForgotPasswordCodeByCode(code);
  if (!existingCode) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  if (new Date(existingCode.expires) < new Date()) {
    await db.forgotPasswordCode.delete({ where: { id: existingCode.id } });
    return NextResponse.json({ error: "Code has expired" }, { status: 400 });
  }

  const user = await getUserByEmail(existingCode.email);
  if (!user) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const hashedPassword = saltAndHash(body.password);
  await db.user.update({
    where: { id: user.id },
    data: { hashedPassword },
  });

  await db.forgotPasswordCode.delete({ where: { id: existingCode.id } });

  return NextResponse.json({ message: "Password reset successful. You can now login." });
}
