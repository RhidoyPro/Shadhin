import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

/**
 * Verify cron job authorization using timing-safe comparison.
 * Returns null if authorized, or an error Response if not.
 */
export function verifyCronAuth(request: Request): NextResponse | null {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || !authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expected = `Bearer ${secret}`;

  // Timing-safe comparison to prevent brute-force timing attacks
  if (authHeader.length !== expected.length) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isValid = timingSafeEqual(
    Buffer.from(authHeader),
    Buffer.from(expected)
  );

  if (!isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
