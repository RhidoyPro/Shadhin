import { jwtVerify, SignJWT } from "jose";
import { UserRole } from "@prisma/client";

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
    .setExpirationTime("30d")
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
 */
export async function requireAuth(req: Request): Promise<ApiUser> {
  const user = await authenticateRequest(req);
  if (!user) throw apiError("Unauthorized", 401);
  if (user.isSuspended) throw apiError("Account suspended", 403);
  return user;
}
