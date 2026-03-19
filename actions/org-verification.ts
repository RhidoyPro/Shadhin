"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdminLevel } from "@/lib/roles";
import { revalidatePath } from "next/cache";

export const requestOrgVerification = async (
  orgName: string,
  orgType: string,
  bkashRef: string
) => {
  const session = await auth();
  if (!session) return { error: "User not authenticated" };

  if (!orgName?.trim()) return { error: "Organisation name is required." };
  if (!orgType?.trim()) return { error: "Organisation type is required." };
  if (!bkashRef || bkashRef.trim().length < 6) {
    return { error: "Please enter a valid bKash transaction reference." };
  }

  // Only one pending request per user
  const existing = await db.orgVerificationRequest.findFirst({
    where: { userId: session.user.id!, status: "PENDING" },
  });
  if (existing) return { error: "You already have a pending verification request." };

  if (session.user.isVerifiedOrg) {
    return { error: "Your account is already verified." };
  }

  await db.orgVerificationRequest.create({
    data: {
      userId: session.user.id!,
      orgName: orgName.trim(),
      orgType: orgType.trim(),
      bkashRef: bkashRef.trim(),
    },
  });

  return { success: true };
};

export const approveOrgVerification = async (requestId: string) => {
  const session = await auth();
  if (!session || !isAdminLevel(session.user.role)) return { error: "Unauthorized" };

  const request = await db.orgVerificationRequest.findUnique({ where: { id: requestId } });
  if (!request) return { error: "Request not found" };
  if (request.status !== "PENDING") return { error: "Request is not pending" };

  await db.$transaction([
    db.orgVerificationRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED" },
    }),
    db.user.update({
      where: { id: request.userId },
      data: { isVerifiedOrg: true },
    }),
  ]);

  revalidatePath("/admin/org-verification");
  return { success: true };
};

export const rejectOrgVerification = async (requestId: string, adminNote?: string) => {
  const session = await auth();
  if (!session || !isAdminLevel(session.user.role)) return { error: "Unauthorized" };

  const request = await db.orgVerificationRequest.findUnique({ where: { id: requestId } });
  if (!request) return { error: "Request not found" };
  if (request.status !== "PENDING") return { error: "Request is not pending" };

  await db.orgVerificationRequest.update({
    where: { id: requestId },
    data: { status: "REJECTED", adminNote: adminNote?.trim() || null },
  });

  revalidatePath("/admin/org-verification");
  return { success: true };
};
