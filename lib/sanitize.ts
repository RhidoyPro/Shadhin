/**
 * Defense-in-depth: strip MongoDB operator keys ($-prefixed) from untrusted input.
 * Prisma already parameterizes queries, but this prevents any edge case where
 * raw input could reach a MongoDB driver directly.
 */

export function sanitizeInput<T>(input: T): T {
  if (input === null || input === undefined) return input;
  if (typeof input !== "object") return input;
  if (Array.isArray(input)) {
    return input.map(sanitizeInput) as T;
  }

  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    // Strip keys starting with $ (MongoDB operators like $ne, $gt, $regex, $where)
    if (key.startsWith("$")) continue;
    cleaned[key] = typeof value === "object" ? sanitizeInput(value) : value;
  }
  return cleaned as T;
}

/**
 * Sanitize a parsed request body. Use after JSON.parse / req.json().
 */
export function sanitizeBody<T>(body: T): T {
  if (body === null || body === undefined) return body;
  return sanitizeInput(body);
}
