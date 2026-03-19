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

// Feed pages cached for 5 minutes — invalidated on create/edit/delete/comment
const FEED_TTL = 300;

export async function getCached<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    return await redis.get<T>(key);
  } catch {
    return null;
  }
}

export async function setCache<T>(
  key: string,
  data: T,
  ttlSeconds: number = FEED_TTL
): Promise<void> {
  if (!redis) return;
  try {
    // Pass data directly — the Upstash SDK handles JSON serialization internally.
    // Do NOT JSON.stringify here or the value will be double-encoded.
    await redis.set(key, data as unknown as string, { ex: ttlSeconds });
  } catch {
    // Non-critical, skip
  }
}

export async function invalidateCache(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    // Non-critical
  }
}

/**
 * Invalidate the cached event pool for a given state.
 * Called on event create, edit, delete, like, and new comments.
 */
export async function invalidateFeedCache(stateName: string): Promise<void> {
  await invalidateCache(`feed-pool:${stateName}`);
}

/**
 * Invalidate the cached viewer context (follow list + home state) for a user.
 * Called on follow/unfollow so feed personalization stays accurate.
 */
export async function invalidateViewerContext(userId: string): Promise<void> {
  await invalidateCache(`viewer-ctx:${userId}`);
}
