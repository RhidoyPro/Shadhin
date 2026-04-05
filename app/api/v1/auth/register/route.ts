import { NextResponse } from "next/server";
import { getUserByEmail } from "@/data/user";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { saltAndHash } from "@/utils/helper";
import { SignupSchema } from "@/utils/zodSchema";
import { sendWelcomeEmail, sendNewDistrictMemberEmail } from "@/lib/mail";
import { headers } from "next/headers";
import { sanitizeBody } from "@/lib/sanitize";
import { validatePasswordNotBreached } from "@/lib/password-check";
import { signMobileToken } from "@/lib/api-auth";

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
    // Normalize email — MongoDB is case-sensitive without collation, so users
    // who sign up with mixed case could never log in with lowercase later.
    email: typeof body.email === "string" ? body.email.trim().toLowerCase() : body.email,
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

  // Check breached passwords
  const breachError = await validatePasswordNotBreached(data.password);
  if (breachError) {
    return NextResponse.json({ error: breachError }, { status: 400 });
  }

  const existing = await getUserByEmail(data.email);
  if (existing) {
    return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  }

  const hashedPassword = saltAndHash(data.password);

  const newUser = await db.user.create({
    data: {
      email: data.email,
      hashedPassword,
      name: `${data.firstName} ${data.lastName}`.trim(),
      firstName: data.firstName,
      lastName: data.lastName,
      university: data.university,
      dateOfBirth: data.dateOfBirth,
      stateName: data.state,
      emailVerified: new Date(),
    },
  });

  // Generate JWT so mobile can auto-login
  const token = await signMobileToken({
    userId: newUser.id,
    email: newUser.email!,
    role: newUser.role,
    isSuspended: newUser.isSuspended,
    isVerifiedOrg: newUser.isVerifiedOrg,
    stateName: newUser.stateName ?? undefined,
    createdAt: newUser.createdAt.toISOString(),
  });

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

  return NextResponse.json({
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      phone: newUser.phone,
      university: newUser.university,
      dateOfBirth: newUser.dateOfBirth?.toISOString() ?? null,
      image: newUser.image,
      role: newUser.role,
      stateName: newUser.stateName,
      bio: newUser.bio,
      isVerifiedOrg: newUser.isVerifiedOrg,
      isSuspended: newUser.isSuspended,
      points: newUser.points,
      createdAt: newUser.createdAt.toISOString(),
    },
  });
}
