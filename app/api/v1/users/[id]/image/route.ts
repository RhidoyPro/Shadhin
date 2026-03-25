import { NextResponse } from "next/server";
import { requireAuth, apiError } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const ALLOWED_IMAGE_HOSTS = [
  "pub-81b012e4d7214ac491438e1df8c5bf00.r2.dev",
];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  const limited = await rateLimit(`api-user-image:${user.userId}`, { limit: 5, windowSeconds: 60 });
  if (limited.limited) return apiError("Too fast", 429);

  if (user.userId !== id) return apiError("Not authorized", 403);

  const body = await req.json().catch(() => null);
  if (!body?.url || typeof body.url !== "string") return apiError("Image URL is required", 400);

  // Validate URL format and restrict to allowed hosts
  let parsed: URL;
  try {
    parsed = new URL(body.url);
  } catch {
    return apiError("Invalid URL", 400);
  }
  if (parsed.protocol !== "https:") return apiError("URL must use HTTPS", 400);
  if (!ALLOWED_IMAGE_HOSTS.includes(parsed.hostname)) {
    return apiError("Image URL must be from our CDN", 400);
  }

  const updated = await db.user.update({
    where: { id },
    data: { image: body.url },
    select: { id: true, name: true, image: true },
  });

  return NextResponse.json({ user: updated });
}
