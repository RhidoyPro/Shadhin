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

const DEFAULT_TTL = 60; // 60 seconds

export async function getCached<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    const data = await redis.get<T>(key);
    return data;
  } catch {
    return null;
  }
}

export async function setCache<T>(
  key: string,
  data: T,
  ttlSeconds: number = DEFAULT_TTL
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(data), { ex: ttlSeconds });
  } catch {
    // Non-critical, skip
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  if (!redis) return;
  try {
    // For exact key deletion
    await redis.del(pattern);
  } catch {
    // Non-critical
  }
}

export async function invalidateFeedCache(stateName: string): Promise<void> {
  if (!redis) return;
  try {
    // Delete all page caches for this state
    // We cache keys like "feed:{stateName}:{page}:{limit}"
    // Since we can't scan with Upstash free tier efficiently,
    // delete the first 5 pages which covers most users
    const keys = Array.from({ length: 5 }, (_, i) =>
      `feed:${stateName}:${i + 1}:10`
    );
    for (const key of keys) {
      await redis.del(key);
    }
  } catch {
    // Non-critical
  }
}
