import { db } from "@/lib/db";

export type AuditAction =
  | "VERIFY_EMAIL"
  | "CHANGE_ROLE"
  | "DELETE_USER"
  | "SUSPEND_USER"
  | "UNSUSPEND_USER"
  | "ADD_STRIKE"
  | "DELETE_EVENT"
  | "DISMISS_REPORT"
  | "TOGGLE_VERIFIED_ORG"
  | "TOGGLE_PROMOTED_POST"
  | "SEND_BROADCAST"
  | string;

export async function logAdminAction({
  adminId,
  action,
  targetId,
  targetType,
  details,
}: {
  adminId: string;
  action: AuditAction;
  targetId?: string;
  targetType?: string;
  details?: string;
}) {
  try {
    await db.auditLog.create({
      data: {
        adminId,
        action,
        targetId,
        targetType,
        details,
      },
    });
  } catch {
    // Audit logging is non-critical — never let it break the main flow
  }
}
