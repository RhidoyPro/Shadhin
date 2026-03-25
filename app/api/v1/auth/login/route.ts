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

export async function POST(req: Request) {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const limited = await rateLimit(`api-login:${ip}`, { limit: 10, windowSeconds: 60 });
  if (limited.limited) {
    return NextResponse.json(
      { error: `Too many attempts. Retry in ${limited.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const parsed = LoginSchemaWithEmail.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const user = await getUserByEmail(email);

  if (!user || !user.hashedPassword) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const isMatch = bcrypt.compareSync(password, user.hashedPassword);
  if (!isMatch) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
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
