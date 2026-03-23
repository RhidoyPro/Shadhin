import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

const PREFIX = "ff:";

export type FeatureFlag = {
  key: string;
  description: string;
  enabled: boolean;
  /** Percentage of users in treatment (0-100). Default 50. */
  rolloutPercent: number;
  createdAt: string;
};

/**
 * Get all feature flags.
 */
export async function getAllFlags(): Promise<FeatureFlag[]> {
  if (!redis) return [];
  try {
    const keys = await redis.keys(`${PREFIX}*`);
    if (!keys.length) return [];
    const pipeline = redis.pipeline();
    for (const key of keys) pipeline.get(key);
    const results = await pipeline.exec();
    return results
      .filter(Boolean)
      .map((r) => (typeof r === "string" ? JSON.parse(r) : r) as FeatureFlag)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

/**
 * Create or update a feature flag.
 */
export async function upsertFlag(flag: FeatureFlag): Promise<void> {
  if (!redis) return;
  await redis.set(`${PREFIX}${flag.key}`, JSON.stringify(flag));
}

/**
 * Delete a feature flag.
 */
export async function deleteFlag(key: string): Promise<void> {
  if (!redis) return;
  await redis.del(`${PREFIX}${key}`);
}

/**
 * Get a single flag.
 */
export async function getFlag(key: string): Promise<FeatureFlag | null> {
  if (!redis) return null;
  try {
    const raw = await redis.get<string>(`${PREFIX}${key}`);
    if (!raw) return null;
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

/**
 * Deterministic assignment: given a userId and flagKey, return "control" or "treatment".
 * Uses a simple hash to bucket users consistently.
 */
export function getVariant(
  userId: string,
  flagKey: string,
  rolloutPercent: number
): "control" | "treatment" {
  // Simple deterministic hash
  const str = `${userId}:${flagKey}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const bucket = Math.abs(hash) % 100;
  return bucket < rolloutPercent ? "treatment" : "control";
}

/**
 * Check if a user should see the treatment variant of a flag.
 * Returns { variant, enabled } — enabled=false means flag is off entirely.
 */
export async function evaluateFlag(
  userId: string,
  flagKey: string
): Promise<{ variant: "control" | "treatment"; enabled: boolean }> {
  const flag = await getFlag(flagKey);
  if (!flag || !flag.enabled) {
    return { variant: "control", enabled: false };
  }
  const variant = getVariant(userId, flagKey, flag.rolloutPercent);
  return { variant, enabled: true };
}
