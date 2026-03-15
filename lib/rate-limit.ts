/**
 * Simple in-memory rate limiter compatible with Next.js App Router server actions.
 * Uses a Map to track attempt counts per key (IP or identifier).
 * Note: This resets on server restarts and does not share state across multiple
 * server instances. For multi-instance deployments, replace with a Redis-backed solution.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  /** Maximum number of attempts allowed within the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

/**
 * Check and increment rate limit for a given key.
 * Returns { limited: true, retryAfterSeconds } if the limit is exceeded,
 * or { limited: false } if the request is allowed.
 */
export function rateLimit(
  key: string,
  { limit, windowSeconds }: RateLimitOptions
): { limited: false } | { limited: true; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { limited: false };
  }

  if (entry.count >= limit) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { limited: true, retryAfterSeconds };
  }

  entry.count += 1;
  return { limited: false };
}
