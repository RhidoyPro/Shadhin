import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signMobileToken } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { sanitizeBody } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

/**
 * Exchange a Google ID token (from mobile Google Sign-In) for a Shadhin JWT.
 * Verifies the ID token with Google, finds or creates the user, returns JWT.
 */
export async function POST(req: Request) {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const limited = await rateLimit(`api-google:${ip}`, { limit: 10, windowSeconds: 60 });
  if (limited.limited) {
    return NextResponse.json(
      { error: `Too many attempts. Retry in ${limited.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const rawBody = await req.json().catch(() => null);
  const body = rawBody ? sanitizeBody(rawBody) : null;
  if (!body?.idToken) {
    return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
  }

  // Verify Google ID token
  let googleUser: { email: string; name: string; picture?: string; sub: string };
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${body.idToken}`);
    if (!res.ok) throw new Error("Invalid token");
    const payload = await res.json();

    // Verify audience matches our Google Client ID
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      return NextResponse.json({ error: "Invalid token audience" }, { status: 401 });
    }

    googleUser = {
      email: payload.email,
      name: payload.name || payload.email.split("@")[0],
      picture: payload.picture,
      sub: payload.sub,
    };
  } catch {
    return NextResponse.json({ error: "Invalid Google token" }, { status: 401 });
  }

  // 1. Try to find user by Google providerAccountId (trusted match)
  let user = await db.user.findFirst({
    where: { accounts: { some: { provider: "google", providerAccountId: googleUser.sub } } },
  });

  if (!user) {
    // 2. No Google-linked user found — check if an email match exists
    const existingByEmail = await db.user.findFirst({
      where: { email: googleUser.email },
      include: { accounts: { where: { provider: "google" } } },
    });

    if (existingByEmail) {
      if (existingByEmail.emailVerified && existingByEmail.accounts.length === 0) {
        // Existing verified account with no Google link — refuse auto-link to
        // prevent account takeover (attacker registers with password, victim's
        // Google login would otherwise grant access to attacker's account).
        return NextResponse.json(
          { error: "An account with this email already exists. Please login with your password." },
          { status: 409 }
        );
      }

      // Unverified password account — safe to assume the Google owner is the
      // real email owner. Link the Google account and verify the email.
      user = existingByEmail;
      if (!user.emailVerified) {
        await db.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
      }
    }
  }

  if (!user) {
    // 3. Brand-new user — create with Google account linked
    user = await db.user.create({
      data: {
        email: googleUser.email,
        name: googleUser.name,
        image: googleUser.picture,
        emailVerified: new Date(),
        stateName: body.stateName || "Dhaka",
        accounts: {
          create: {
            type: "oauth",
            provider: "google",
            providerAccountId: googleUser.sub,
          },
        },
      },
    });
  }

  // Ensure Google account is linked (covers the unverified-email-link path)
  const linkedAccount = await db.account.findFirst({
    where: { userId: user.id, provider: "google" },
  });
  if (!linkedAccount) {
    await db.account.create({
      data: { userId: user.id, type: "oauth", provider: "google", providerAccountId: googleUser.sub },
    });
  }

  if (user.isSuspended) {
    return NextResponse.json({ error: "Account suspended" }, { status: 403 });
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
      createdAt: user.createdAt?.toISOString() ?? null,
    },
  });
}
