import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const limited = await rateLimit(`api-org-verify:${user.userId}`, { limit: 3, windowSeconds: 60 });
  if (limited.limited) {
    return NextResponse.json({ error: "Too fast" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const bkashValid = /^[A-Za-z0-9]{6,20}$/.test(body?.bkashRef || "");
  if (!body?.orgName || typeof body.orgName !== "string" || body.orgName.length > 100 ||
      !body?.orgType || typeof body.orgType !== "string" || body.orgType.length > 50 ||
      !bkashValid) {
    return NextResponse.json({ error: "orgName (max 100), orgType (max 50), and valid bkashRef (6-20 alphanumeric) required" }, { status: 400 });
  }

  // Check if already verified or has pending request
  const dbUser = await db.user.findUnique({ where: { id: user.userId }, select: { isVerifiedOrg: true } });
  if (dbUser?.isVerifiedOrg) return NextResponse.json({ error: "Already verified" }, { status: 409 });

  const existing = await db.orgVerificationRequest.findFirst({
    where: { userId: user.userId, status: "PENDING" },
  });
  if (existing) return NextResponse.json({ error: "Request already pending" }, { status: 409 });

  await db.orgVerificationRequest.create({
    data: {
      userId: user.userId,
      orgName: body.orgName,
      orgType: body.orgType,
      bkashRef: body.bkashRef,
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
