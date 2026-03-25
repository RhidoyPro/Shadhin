import { jwtVerify, SignJWT } from "jose";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export interface ApiUser {
  userId: string;
  email: string;
  role: UserRole;
  isSuspended: boolean;
  isVerifiedOrg: boolean;
  stateName?: string;
  createdAt?: string;
}

const AUTH_SECRET = process.env.AUTH_SECRET;

function getSecretKey() {
  if (!AUTH_SECRET) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(AUTH_SECRET);
}

/**
 * Sign a JWT for mobile clients (returned in response body, not cookie).
 * Uses the same AUTH_SECRET as NextAuth so tokens are interoperable.
 */
export async function signMobileToken(payload: ApiUser): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .setSubject(payload.userId)
    .sign(getSecretKey());
}

/**
 * Extract and verify JWT from Authorization: Bearer <token> header.
 * Returns the decoded ApiUser or null if invalid/missing.
 */
export async function authenticateRequest(
  req: Request
): Promise<ApiUser | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.userId || !payload.email) return null;

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: (payload.role as UserRole) || "USER",
      isSuspended: (payload.isSuspended as boolean) || false,
      isVerifiedOrg: (payload.isVerifiedOrg as boolean) || false,
      stateName: payload.stateName as string | undefined,
      createdAt: payload.createdAt as string | undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Helper to create a JSON error response.
 */
export function apiError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

/**
 * Helper to require authentication. Returns ApiUser or throws Response.
 * Verifies the JWT wasn't issued before a password change (token revocation).
 */
export async function requireAuth(req: Request): Promise<ApiUser> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) throw apiError("Unauthorized", 401);

  const token = authHeader.slice(7);
  if (!token) throw apiError("Unauthorized", 401);

  let payload;
  try {
    const result = await jwtVerify(token, getSecretKey());
    payload = result.payload;
  } catch {
    throw apiError("Unauthorized", 401);
  }

  if (!payload.userId || !payload.email) throw apiError("Unauthorized", 401);

  // Check if token was issued before password change (stale JWT detection)
  const dbUser = await db.user.findUnique({
    where: { id: payload.userId as string },
    select: { isSuspended: true, passwordChangedAt: true },
  });

  if (!dbUser) throw apiError("Unauthorized", 401);
  if (dbUser.isSuspended) throw apiError("Account suspended", 403);

  // Reject tokens issued before the last password change
  if (dbUser.passwordChangedAt && payload.iat) {
    const changedAtSeconds = Math.floor(dbUser.passwordChangedAt.getTime() / 1000);
    if (payload.iat < changedAtSeconds) {
      throw apiError("Token expired. Please log in again.", 401);
    }
  }

  return {
    userId: payload.userId as string,
    email: payload.email as string,
    role: (payload.role as UserRole) || "USER",
    isSuspended: false,
    isVerifiedOrg: (payload.isVerifiedOrg as boolean) || false,
    stateName: payload.stateName as string | undefined,
    createdAt: payload.createdAt as string | undefined,
  };
}
