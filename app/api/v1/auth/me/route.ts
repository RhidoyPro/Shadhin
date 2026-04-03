import { NextResponse } from "next/server";
import { authenticateRequest, apiError } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const apiUser = await authenticateRequest(req);
  if (!apiUser) return apiError("Unauthorized", 401);

  const limited = await rateLimit(`api-me:${apiUser.userId}`, { limit: 30, windowSeconds: 60 });
  if (limited.limited) return apiError("Too many requests", 429);

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

  if (!user) return apiError("User not found", 404);
  if (user.isSuspended) return apiError("Account suspended", 403);

  return NextResponse.json({ user });
}
