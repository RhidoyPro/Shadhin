import { NextResponse } from "next/server";
import { authenticateRequest, requireAuth, apiError } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { getFollowCounts, isFollowing } from "@/data/user";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await authenticateRequest(req);

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, image: true, role: true,
      stateName: true, university: true, bio: true, dateOfBirth: true,
      isVerifiedOrg: true, points: true, createdAt: true,
      _count: { select: { events: true } },
    },
  });

  if (!user) return apiError("User not found", 404);

  const followCounts = await getFollowCounts(id);
  const following = viewer ? await isFollowing(viewer.userId, id) : false;

  return NextResponse.json({
    user: {
      ...user,
      eventsCount: user._count.events,
      _count: {
        events: user._count.events,
        followers: followCounts.followers,
        following: followCounts.following,
      },
    },
    followCounts,
    isFollowing: following,
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  if (user.userId !== id) return apiError("Not authorized", 403);

  const body = await req.json().catch(() => null);
  if (!body) return apiError("Invalid body", 400);

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.university !== undefined) data.university = body.university;
  if (body.bio !== undefined) {
    if (body.bio.length > 300) return apiError("Bio too long (max 300)", 400);
    data.bio = body.bio;
  }
  if (body.stateName !== undefined) data.stateName = body.stateName;
  if (body.dateOfBirth !== undefined) data.dateOfBirth = new Date(body.dateOfBirth);

  const updated = await db.user.update({
    where: { id },
    data,
    select: {
      id: true, name: true, email: true, image: true, role: true,
      stateName: true, university: true, bio: true, isVerifiedOrg: true,
    },
  });

  return NextResponse.json({ user: updated });
}
