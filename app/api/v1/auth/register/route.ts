import { NextResponse } from "next/server";
import { getUserByEmail } from "@/data/user";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { saltAndHash } from "@/utils/helper";
import { SignupSchema } from "@/utils/zodSchema";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail, sendWelcomeEmail, sendNewDistrictMemberEmail } from "@/lib/mail";
import { updateIsEmailSent } from "@/data/verification-token";
import { headers } from "next/headers";
import { sanitizeBody } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const limited = await rateLimit(`api-signup:${ip}`, { limit: 5, windowSeconds: 300 });
  if (limited.limited) {
    return NextResponse.json(
      { error: `Too many attempts. Retry in ${limited.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const rawBody = await req.json().catch(() => null);
  if (!rawBody) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const body = sanitizeBody(rawBody);

  // Map mobile field names to schema
  const data = {
    email: body.email,
    password: body.password,
    firstName: body.firstName || body.name?.split(" ")[0],
    lastName: body.lastName || body.name?.split(" ").slice(1).join(" ") || "",
    university: body.university,
    dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
    state: body.stateName || body.state,
  };

  const parsed = SignupSchema.safeParse(data);
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    const firstError = Object.values(errors)[0]?.[0] || "Invalid input";
    return NextResponse.json({ error: firstError }, { status: 400 });
  }

  // Don't reveal if email exists
  const existing = await getUserByEmail(data.email);
  if (existing) {
    return NextResponse.json({ message: "Verification email sent! Please verify your email and login." });
  }

  const hashedPassword = saltAndHash(data.password);

  await db.user.create({
    data: {
      email: data.email,
      hashedPassword,
      name: `${data.firstName} ${data.lastName}`.trim(),
      firstName: data.firstName,
      lastName: data.lastName,
      university: data.university,
      dateOfBirth: data.dateOfBirth,
      stateName: data.state,
    },
  });

  const verificationToken = await generateVerificationToken(data.email);
  await sendVerificationEmail(verificationToken.email, verificationToken.token);
  await updateIsEmailSent(verificationToken.token);

  // Non-blocking emails
  sendWelcomeEmail(data.email, data.firstName, data.state).catch(() => {});
  db.user.findMany({
    where: { stateName: data.state, emailVerified: { not: null }, email: { not: data.email } },
    select: { email: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  }).then((users) => {
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    for (const u of users) {
      if (u.email) sendNewDistrictMemberEmail(u.email, fullName, data.state).catch(() => {});
    }
  }).catch(() => {});

  return NextResponse.json({ message: "Verification email sent! Please verify your email and login." });
}
