import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
}

type RateLimitResult =
  | { limited: false }
  | { limited: true; retryAfterSeconds: number };

// ── Redis-backed (production) ─────────────────────────────────────────────────
// When UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, all rate
// limit state is stored in Redis and shared across every Vercel serverless
// instance. Without this, each cold-start gets its own empty counter and the
// limit is trivially bypassed.

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

// Cache Ratelimit instances so we don't recreate them on every call
const limiterCache = new Map<string, Ratelimit>();

function getRedisLimiter(limit: number, windowSeconds: number): Ratelimit {
  const cacheKey = `${limit}:${windowSeconds}`;
  if (!limiterCache.has(cacheKey)) {
    limiterCache.set(
      cacheKey,
      new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
        analytics: false,
      })
    );
  }
  return limiterCache.get(cacheKey)!;
}

// ── In-memory fallback (local dev / no Redis configured) ─────────────────────
interface InMemoryEntry {
  count: number;
  resetAt: number;
}
const memoryStore = new Map<string, InMemoryEntry>();

function memoryRateLimit(
  key: string,
  { limit, windowSeconds }: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { limited: false };
  }

  if (entry.count >= limit) {
    return {
      limited: true,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count += 1;
  return { limited: false };
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function rateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  if (!redis) {
    // No Redis configured — use in-memory fallback
    return memoryRateLimit(key, options);
  }

  const limiter = getRedisLimiter(options.limit, options.windowSeconds);
  const result = await limiter.limit(key);

  if (result.success) {
    return { limited: false };
  }

  const retryAfterSeconds = Math.ceil((result.reset - Date.now()) / 1000);
  return { limited: true, retryAfterSeconds: Math.max(1, retryAfterSeconds) };
}
