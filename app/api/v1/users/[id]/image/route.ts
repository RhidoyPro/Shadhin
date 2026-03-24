import { NextResponse } from "next/server";
import { requireAuth, apiError } from "@/lib/api-auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let user;
  try { user = await requireAuth(req); } catch (e) { return e as Response; }

  if (user.userId !== id) return apiError("Not authorized", 403);

  const body = await req.json().catch(() => null);
  if (!body?.url) return apiError("Image URL is required", 400);

  const updated = await db.user.update({
    where: { id },
    data: { image: body.url },
    select: { id: true, name: true, image: true },
  });

  return NextResponse.json({ user: updated });
}
