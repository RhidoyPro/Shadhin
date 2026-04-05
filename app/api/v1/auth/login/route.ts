import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/data/user";
import { signMobileToken } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
import { LoginSchemaWithEmail } from "@/utils/zodSchema";
import { headers } from "next/headers";
import { getVerificationTokenByEmail, updateIsEmailSent } from "@/data/verification-token";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { db } from "@/lib/db";
import { sanitizeBody } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(req: Request) {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const limited = await rateLimit(`api-login:${ip}`, { limit: 10, windowSeconds: 60 });
  if (limited.limited) {
    return NextResponse.json(
      { error: `Too many attempts. Retry in ${limited.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const rawBody = await req.json().catch(() => null);
  if (!rawBody) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const body = sanitizeBody(rawBody);

  const parsed = LoginSchemaWithEmail.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }

  const { email: rawEmail, password } = parsed.data;
  // Normalize email before DB lookup — MongoDB findUnique is case-sensitive
  // without explicit collation, so "Foo@x.com" and "foo@x.com" would miss.
  const email = rawEmail.trim().toLowerCase();
  const user = await getUserByEmail(email);

  if (!user || !user.hashedPassword) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Account lockout check
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const remainingMs = new Date(user.lockedUntil).getTime() - Date.now();
    const remainingMin = Math.ceil(remainingMs / 60000);
    return NextResponse.json(
      { error: `Account temporarily locked. Try again in ${remainingMin} minute(s).` },
      { status: 423 }
    );
  }

  const isMatch = bcrypt.compareSync(password, user.hashedPassword);
  if (!isMatch) {
    const attempts = (user.failedLoginAttempts ?? 0) + 1;
    const updateData: { failedLoginAttempts: number; lockedUntil?: Date } = {
      failedLoginAttempts: attempts,
    };
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
    }
    await db.user.update({ where: { id: user.id }, data: updateData }).catch(() => {});
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Reset failed attempts on successful login
  if ((user.failedLoginAttempts ?? 0) > 0 || user.lockedUntil) {
    await db.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    }).catch(() => {});
  }

  // Check for suspended account after password match
  if (user.isSuspended) {
    return NextResponse.json({ error: "Account suspended" }, { status: 403 });
  }

  if (!user.emailVerified) {
    // Resend verification email
    const existingToken = await getVerificationTokenByEmail(user.email!);
    if (!existingToken || new Date(existingToken.expires) < new Date()) {
      const token = await generateVerificationToken(user.email!);
      await sendVerificationEmail(token.email, token.token);
      await updateIsEmailSent(token.token);
    } else {
      await sendVerificationEmail(existingToken.email, existingToken.token);
      await updateIsEmailSent(existingToken.token);
    }
    return NextResponse.json(
      { error: "Email not verified. Verification email sent." },
      { status: 403 }
    );
  }

  const token = await signMobileToken({
    userId: user.id,
    email: user.email!,
    role: user.role,
    isSuspended: user.isSuspended,
    isVerifiedOrg: user.isVerifiedOrg,
    stateName: user.stateName ?? undefined,
    createdAt: user.createdAt?.toISOString(),
  });

  return NextResponse.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      university: user.university,
      dateOfBirth: user.dateOfBirth?.toISOString() ?? null,
      image: user.image,
      role: user.role,
      stateName: user.stateName,
      bio: user.bio,
      isVerifiedOrg: user.isVerifiedOrg,
      isSuspended: user.isSuspended,
      points: user.points,
      createdAt: user.createdAt.toISOString(),
    },
  });
}
