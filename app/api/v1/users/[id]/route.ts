import { NextResponse } from "next/server";
import { authenticateRequest, requireAuth, apiError } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { getFollowCounts, isFollowing } from "@/data/user";
import { z } from "zod";
import BangladeshStates from "@/data/bangladesh-states";
import { moderateText } from "@/lib/moderation";

const VALID_STATE_SLUGS = BangladeshStates.filter((s) => s.slug !== "all-districts").map((s) => s.slug);

const PatchProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters").optional(),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
  university: z.string().max(100, "University cannot exceed 100 characters").optional(),
  stateName: z.string().refine((s) => VALID_STATE_SLUGS.includes(s), {
    message: "Invalid Bangladesh district",
  }).optional(),
  phone: z.string().max(20, "Phone cannot exceed 20 characters").optional(),
  dateOfBirth: z.string().datetime({ message: "Invalid ISO date format" }).optional(),
}).strict();

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const limited = await rateLimit(`api-user-read:${ip}`, { limit: 60, windowSeconds: 60 });
  if (limited.limited) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { id } = await params;
  const viewer = await authenticateRequest(req);

  const isOwner = viewer?.userId === id;

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, image: true, role: true,
      stateName: true, university: true, bio: true,
      isVerifiedOrg: true, points: true, createdAt: true,
      _count: { select: { events: true } },
      // PII fields — only selected for the profile owner
      ...(isOwner && { email: true, dateOfBirth: true }),
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

  const parsed = PatchProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { dateOfBirth, ...rest } = parsed.data;

  // Moderate user-visible text fields
  const textFields = [rest.name, rest.bio, rest.university].filter(
    (t): t is string => typeof t === "string" && t.trim().length > 0,
  );
  for (const text of textFields) {
    const mod = await moderateText(text);
    if (mod.flagged) {
      return apiError("Profile contains inappropriate content. Please revise.", 400);
    }
  }

  const data: Record<string, unknown> = { ...rest };
  if (dateOfBirth !== undefined) data.dateOfBirth = new Date(dateOfBirth);

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
