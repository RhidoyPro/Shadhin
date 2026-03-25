import { NextResponse } from "next/server";
import { authenticateRequest, apiError } from "@/lib/api-auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const apiUser = await authenticateRequest(req);
  if (!apiUser) return apiError("Unauthorized", 401);

  const user = await db.user.findUnique({
    where: { id: apiUser.userId },
    select: {
      id: true,
      name: true,
      email: true,
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

  if (!user) return apiError("User not found", 404);
  if (user.isSuspended) return apiError("Account suspended", 403);

  return NextResponse.json({ user });
}
