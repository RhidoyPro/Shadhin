"use client";

import React, { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { approveOrgVerification, rejectOrgVerification } from "@/actions/org-verification";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

type OrgVerificationRequestRow = {
  id: string;
  orgName: string;
  orgType: string;
  bkashRef: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote: string | null;
  createdAt: Date;
  user: { id: string; name: string; email: string | null };
};

type Props = {
  requests: OrgVerificationRequestRow[];
};

function StatusBadge({ status }: { status: "PENDING" | "APPROVED" | "REJECTED" }) {
  const styles = {
    PENDING:
      "inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400",
    APPROVED:
      "inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400",
    REJECTED:
      "inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-400",
  };
  return <span className={styles[status]}>{status}</span>;
}

function OrgVerificationRow({ request }: { request: OrgVerificationRequestRow }) {
  const [isPending, startTransition] = useTransition();
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  const handleApprove = () => {
    startTransition(async () => {
      const res = await approveOrgVerification(request.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Organisation verified.");
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const res = await rejectOrgVerification(request.id, adminNote);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Request rejected.");
        setShowRejectInput(false);
        setAdminNote("");
      }
    });
  };

  return (
    <TableRow>
      <TableCell>
        <Link href={`/user/${request.user.id}`} className="text-sm font-medium hover:underline">
          {request.user.name}
        </Link>
        <p className="text-xs text-muted-foreground">{request.user.email}</p>
      </TableCell>
      <TableCell className="text-sm font-medium">{request.orgName}</TableCell>
      <TableCell>
        <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
          {request.orgType}
        </span>
      </TableCell>
      <TableCell>
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
          {request.bkashRef}
        </code>
      </TableCell>
      <TableCell>
        <StatusBadge status={request.status} />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDistanceToNow(request.createdAt, { addSuffix: true })}
      </TableCell>
      <TableCell>
        {request.status === "PENDING" ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-1.5">
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleApprove}
                disabled={isPending}
              >
                {isPending ? "..." : "Approve"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-destructive border-destructive/50 hover:bg-destructive/10"
                onClick={() => setShowRejectInput((v) => !v)}
                disabled={isPending}
              >
                Reject
              </Button>
            </div>
            {showRejectInput && (
              <div className="flex gap-1.5 mt-1">
                <Input
                  placeholder="Admin note (optional)"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="h-7 text-xs"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs shrink-0"
                  onClick={handleReject}
                  disabled={isPending}
                >
                  {isPending ? "..." : "Confirm"}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">
            {request.adminNote || "—"}
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}

export function OrgVerificationTable({ requests }: Props) {
  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">No verification requests yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Org Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>bKash Ref</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((req) => (
            <OrgVerificationRow key={req.id} request={req} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
