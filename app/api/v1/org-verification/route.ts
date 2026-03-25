import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const body = await req.json().catch(() => null);
  if (!body?.orgName || !body?.orgType || !body?.bkashRef || body.bkashRef.length < 6) {
    return NextResponse.json({ error: "orgName, orgType, and bkashRef required" }, { status: 400 });
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
