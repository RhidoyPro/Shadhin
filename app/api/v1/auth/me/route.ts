import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { saltAndHash } from "@/utils/helper";
import { validatePasswordNotBreached } from "@/lib/password-check";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  let apiUser;
  try { apiUser = await requireAuth(req); } catch (e) { return e as Response; }

  const limited = await rateLimit(`api-me:${apiUser.userId}`, { limit: 30, windowSeconds: 60 });
  if (limited.limited) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const user = await db.user.findUnique({
    where: { id: apiUser.userId },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      image: true,
      role: true,
      stateName: true,
      university: true,
      bio: true,
      dateOfBirth: true,
      isSuspended: true,
      isVerifiedOrg: true,
      points: true,
      createdAt: true,
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  let apiUser;
  try { apiUser = await requireAuth(req); } catch (e) { return e as Response; }

  const limited = await rateLimit(`api-change-pw:${apiUser.userId}`, { limit: 5, windowSeconds: 300 });
  if (limited.limited) return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { currentPassword, newPassword } = body;

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  if (newPassword.length > 128) {
    return NextResponse.json({ error: "Password too long" }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { id: apiUser.userId },
    select: { hashedPassword: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.hashedPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required" }, { status: 400 });
    }
    const isMatch = bcrypt.compareSync(currentPassword, user.hashedPassword);
    if (!isMatch) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }
  }

  const breachError = await validatePasswordNotBreached(newPassword);
  if (breachError) return NextResponse.json({ error: breachError }, { status: 400 });

  const hashedPassword = saltAndHash(newPassword);

  await db.user.update({
    where: { id: apiUser.userId },
    data: { hashedPassword, passwordChangedAt: new Date() },
  });

  return NextResponse.json({ success: true, message: "Password updated successfully" });
}
