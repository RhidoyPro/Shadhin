import React from "react";
import { db } from "@/lib/db";
import { formatDistanceToNow } from "date-fns";
import { ClipboardListIcon, ShieldCheck, Trash2, UserX, UserCheck, AlertTriangle, BadgeCheck, Megaphone, Star, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ACTION_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  ADD_STRIKE: { label: "Added Strike", icon: AlertTriangle, color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  SUSPEND_USER: { label: "Suspended User", icon: UserX, color: "bg-red-500/10 text-red-600 dark:text-red-400" },
  UNSUSPEND_USER: { label: "Unsuspended User", icon: UserCheck, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  DELETE_USER: { label: "Deleted User", icon: Trash2, color: "bg-red-500/10 text-red-600 dark:text-red-400" },
  DELETE_EVENT: { label: "Deleted Event", icon: Trash2, color: "bg-red-500/10 text-red-600 dark:text-red-400" },
  VERIFY_EMAIL: { label: "Verified Email", icon: ShieldCheck, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  CHANGE_ROLE: { label: "Changed Role", icon: ShieldCheck, color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  DISMISS_REPORT: { label: "Dismissed Report", icon: ClipboardListIcon, color: "bg-slate-500/10 text-slate-600 dark:text-slate-400" },
  TOGGLE_VERIFIED_ORG: { label: "Toggled Org Badge", icon: BadgeCheck, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  TOGGLE_PROMOTED_POST: { label: "Toggled Promotion", icon: Star, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  SEND_BROADCAST: { label: "Sent Broadcast", icon: Megaphone, color: "bg-pink-500/10 text-pink-600 dark:text-pink-400" },
};

const AuditLogPage = async ({
  searchParams,
}: {
  searchParams: { page?: string };
}) => {
  const page = Math.max(1, parseInt(searchParams.page || "1", 10));
  const limit = 50;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        admin: { select: { id: true, name: true, image: true } },
      },
      skip,
      take: limit,
    }),
    db.auditLog.count(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total.toLocaleString()} admin actions recorded
        </p>
      </div>

      <Card className="rounded-xl border border-border bg-card">
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <ClipboardListIcon className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No admin actions recorded yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log) => {
                const meta = ACTION_META[log.action] ?? {
                  label: log.action,
                  icon: Zap,
                  color: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
                };
                const Icon = meta.icon;

                return (
                  <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                    <div className={`mt-0.5 rounded-full p-1.5 shrink-0 ${meta.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium">{log.admin.name}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-sm text-muted-foreground">{meta.label}</span>
                      </div>
                      {log.details && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.details}</p>
                      )}
                      {log.targetId && (
                        <p className="text-xs text-muted-foreground/60 mt-0.5 font-mono">
                          {log.targetType}: {log.targetId}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(log.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`/admin/audit-log?page=${page - 1}`}
                className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent transition-colors"
              >
                Previous
              </a>
            )}
            {page < totalPages && (
              <a
                href={`/admin/audit-log?page=${page + 1}`}
                className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent transition-colors"
              >
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
