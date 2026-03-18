import { UserRole } from "@prisma/client";

/** Returns true for ADMIN or SUPER_USER — both can access the admin panel */
export const isAdminLevel = (role: string | null | undefined): boolean =>
  role === UserRole.ADMIN || role === UserRole.SUPER_USER;

/** Only SUPER_USER can promote others to ADMIN or SUPER_USER */
export const canAssignRole = (
  actorRole: string | null | undefined,
  targetRole: UserRole
): boolean => {
  if (actorRole === UserRole.SUPER_USER) return true;
  if (actorRole === UserRole.ADMIN && targetRole === UserRole.USER) return true;
  return false;
};
