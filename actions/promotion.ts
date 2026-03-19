"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdminLevel } from "@/lib/roles";
import { invalidateFeedCache } from "@/lib/cache";
import { revalidatePath } from "next/cache";

const PROMOTION_TIERS: Record<number, number> = {
  3: 50,
  7: 100,
  14: 200,
};

export const requestPromotion = async (
  eventId: string,
  durationDays: number,
  bkashRef: string
) => {
  const session = await auth();
  if (!session) return { error: "User not authenticated" };

  const amountBDT = PROMOTION_TIERS[durationDays];
  if (!amountBDT) return { error: "Invalid duration. Choose 3, 7, or 14 days." };

  if (!bkashRef || bkashRef.trim().length < 6) {
    return { error: "Please enter a valid bKash transaction reference." };
  }

  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) return { error: "Post not found" };
  if (event.userId !== session.user.id) return { error: "Unauthorized" };

  // Check for existing pending request for this event
  const existing = await db.promotionRequest.findFirst({
    where: { eventId, status: "PENDING" },
  });
  if (existing) return { error: "A promotion request for this post is already pending." };

  await db.promotionRequest.create({
    data: {
      eventId,
      userId: session.user.id!,
      durationDays,
      amountBDT,
      bkashRef: bkashRef.trim(),
    },
  });

  return { success: true };
};

export const approvePromotion = async (requestId: string) => {
  const session = await auth();
  if (!session || !isAdminLevel(session.user.role)) return { error: "Unauthorized" };

  const request = await db.promotionRequest.findUnique({
    where: { id: requestId },
    include: { event: true },
  });
  if (!request) return { error: "Request not found" };
  if (request.status !== "PENDING") return { error: "Request is not pending" };

  const promotedUntil = new Date();
  promotedUntil.setDate(promotedUntil.getDate() + request.durationDays);

  await db.$transaction([
    db.promotionRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED" },
    }),
    db.event.update({
      where: { id: request.eventId },
      data: { isPromoted: true, promotedUntil },
    }),
  ]);

  invalidateFeedCache(request.event.stateName).catch(() => {});
  revalidatePath("/admin/promotions");
  return { success: true };
};

export const rejectPromotion = async (requestId: string, adminNote?: string) => {
  const session = await auth();
  if (!session || !isAdminLevel(session.user.role)) return { error: "Unauthorized" };

  const request = await db.promotionRequest.findUnique({ where: { id: requestId } });
  if (!request) return { error: "Request not found" };
  if (request.status !== "PENDING") return { error: "Request is not pending" };

  await db.promotionRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED", adminNote: adminNote?.trim() || null },
  });

  revalidatePath("/admin/promotions");
  return { success: true };
};
