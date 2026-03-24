import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signMobileToken } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

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

  const body = await req.json().catch(() => null);
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

  // Find existing user by email or Google account
  let user = await db.user.findFirst({
    where: {
      OR: [
        { email: googleUser.email },
        { accounts: { some: { provider: "google", providerAccountId: googleUser.sub } } },
      ],
    },
  });

  if (!user) {
    // Create new user + link Google account
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
  } else if (!user.emailVerified) {
    // Verify email on Google OAuth
    await db.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
  }

  // Ensure Google account is linked
  const linkedAccount = await db.account.findFirst({
    where: { userId: user.id, provider: "google" },
  });
  if (!linkedAccount) {
    await db.account.create({
      data: { userId: user.id, type: "oauth", provider: "google", providerAccountId: googleUser.sub },
    });
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
      email: user.email,
      image: user.image,
      role: user.role,
      stateName: user.stateName,
      isVerifiedOrg: user.isVerifiedOrg,
    },
  });
}
