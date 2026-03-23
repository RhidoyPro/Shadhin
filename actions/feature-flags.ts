"use server";

import { auth } from "@/auth";
import {
  upsertFlag,
  deleteFlag,
  getAllFlags,
  type FeatureFlag,
} from "@/lib/feature-flags";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function createFlag(data: {
  key: string;
  description: string;
  rolloutPercent: number;
}) {
  await requireAdmin();
  const flag: FeatureFlag = {
    key: data.key
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_")
      .slice(0, 50),
    description: data.description.slice(0, 200),
    enabled: true,
    rolloutPercent: Math.max(0, Math.min(100, data.rolloutPercent)),
    createdAt: new Date().toISOString(),
  };
  await upsertFlag(flag);
  return { success: true };
}

export async function toggleFlag(key: string, enabled: boolean) {
  await requireAdmin();
  const flags = await getAllFlags();
  const flag = flags.find((f) => f.key === key);
  if (!flag) return { error: "Flag not found" };
  await upsertFlag({ ...flag, enabled });
  return { success: true };
}

export async function updateFlagRollout(key: string, rolloutPercent: number) {
  await requireAdmin();
  const flags = await getAllFlags();
  const flag = flags.find((f) => f.key === key);
  if (!flag) return { error: "Flag not found" };
  await upsertFlag({
    ...flag,
    rolloutPercent: Math.max(0, Math.min(100, rolloutPercent)),
  });
  return { success: true };
}

export async function removeFlag(key: string) {
  await requireAdmin();
  await deleteFlag(key);
  return { success: true };
}

export async function listFlags() {
  await requireAdmin();
  return getAllFlags();
}
