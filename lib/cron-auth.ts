import { NextResponse } from "next/server";
import { timingSafeEqual, createHmac } from "crypto";

/**
 * Verify cron job authorization using timing-safe comparison.
 * Uses HMAC-based comparison to avoid leaking length information.
 * Returns null if authorized, or an error Response if not.
 */
export function verifyCronAuth(request: Request): NextResponse | null {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || !authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expected = `Bearer ${secret}`;

  // HMAC both values to fixed-length digests — prevents length leakage
  const hmacKey = Buffer.from(secret);
  const a = createHmac("sha256", hmacKey).update(authHeader).digest();
  const b = createHmac("sha256", hmacKey).update(expected).digest();

  if (!timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
