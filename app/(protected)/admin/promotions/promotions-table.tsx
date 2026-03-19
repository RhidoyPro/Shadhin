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
import { approvePromotion, rejectPromotion } from "@/actions/promotion";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

type PromotionRequestRow = {
  id: string;
  durationDays: number;
  amountBDT: number;
  bkashRef: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote: string | null;
  createdAt: Date;
  user: { id: string; name: string; email: string | null };
  event: { id: string; content: string; stateName: string };
};

type Props = {
  requests: PromotionRequestRow[];
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

function PromotionRow({ request }: { request: PromotionRequestRow }) {
  const [isPending, startTransition] = useTransition();
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [adminNote, setAdminNote] = useState("");

  const handleApprove = () => {
    startTransition(async () => {
      const res = await approvePromotion(request.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Promotion approved.");
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const res = await rejectPromotion(request.id, adminNote);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Promotion rejected.");
        setShowRejectInput(false);
        setAdminNote("");
      }
    });
  };

  const excerpt =
    request.event.content.length > 60
      ? request.event.content.slice(0, 57) + "..."
      : request.event.content;

  return (
    <TableRow>
      <TableCell className="max-w-[180px]">
        <Link
          href={`/events/details/${request.event.id}`}
          className="text-sm hover:underline text-foreground line-clamp-2"
        >
          {excerpt}
        </Link>
        <span className="text-xs text-muted-foreground">{request.event.stateName}</span>
      </TableCell>
      <TableCell>
        <p className="text-sm font-medium">{request.user.name}</p>
        <p className="text-xs text-muted-foreground">{request.user.email}</p>
      </TableCell>
      <TableCell className="text-sm">{request.durationDays}d</TableCell>
      <TableCell className="text-sm">৳{request.amountBDT}</TableCell>
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

export function PromotionsTable({ requests }: Props) {
  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">No promotion requests yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Post</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>bKash Ref</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((req) => (
            <PromotionRow key={req.id} request={req} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
