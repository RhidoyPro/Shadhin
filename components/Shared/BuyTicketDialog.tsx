"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { buyTicket } from "@/actions/ticket";
import { analytics } from "@/utils/analytics";

const BKASH_NUMBER =
  process.env.NEXT_PUBLIC_BKASH_NUMBER || "01700000000";

type Props = {
  eventId: string;
  ticketPrice: number;
  eventTitle: string;
  open: boolean;
  onClose: () => void;
};

const BuyTicketDialog = ({ eventId, ticketPrice, eventTitle, open, onClose }: Props) => {
  const [bkashRef, setBkashRef] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const fee = Math.round(ticketPrice * 0.05 * 100) / 100;
  const total = Math.round((ticketPrice + fee) * 100) / 100;

  // Track when user opens the ticket dialog
  useEffect(() => {
    if (open) analytics.ticketViewed(eventId, total);
  }, [open, eventId, total]);

  const handleSubmit = () => {
    if (!bkashRef.trim() || bkashRef.trim().length < 6) {
      toast.error("Please enter a valid bKash transaction reference (min 6 chars).");
      return;
    }
    analytics.ticketPurchaseInitiated(eventId, total);
    startTransition(async () => {
      const res = await buyTicket(eventId, bkashRef);
      if (res.error) {
        toast.error(res.error);
      } else {
        analytics.ticketPurchaseSubmitted(eventId, total);
        setSubmitted(true);
      }
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      setTimeout(() => {
        setBkashRef("");
        setSubmitted(false);
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buy Ticket</DialogTitle>
          <DialogDescription className="line-clamp-2 text-sm">
            &ldquo;{eventTitle}&rdquo;
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 text-center">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Ticket request submitted!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Your ticket request is under review. We&apos;ll confirm it once the payment is verified.
              </p>
            </div>
            <Button className="w-full" variant="outline" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-5 py-1">
            {/* Price breakdown */}
            <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-2">
              <p className="text-sm font-medium">Price Breakdown</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ticket price</span>
                  <span className="font-medium">৳{ticketPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform fee (5%)</span>
                  <span className="font-medium">৳{fee}</span>
                </div>
                <div className="flex justify-between border-t pt-1.5 mt-1.5">
                  <span className="font-semibold">Total to pay</span>
                  <span className="font-bold text-primary">৳{total}</span>
                </div>
              </div>
            </div>

            {/* Payment instructions */}
            <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-2">
              <p className="text-sm font-medium">Payment Instructions</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>
                  Send <span className="font-semibold text-foreground">৳{total}</span> to bKash number{" "}
                  <span className="font-mono font-semibold text-foreground">{BKASH_NUMBER}</span>
                </li>
                <li>Use &ldquo;Send Money&rdquo; (not payment)</li>
                <li>Copy the TrxID from your bKash confirmation SMS</li>
                <li>Paste it below and submit</li>
              </ol>
            </div>

            {/* bKash reference input */}
            <div className="space-y-1.5">
              <Label htmlFor="ticket-bkash-ref" className="text-sm font-medium">
                bKash TrxID
              </Label>
              <Input
                id="ticket-bkash-ref"
                placeholder="e.g. 8N5J2K3A4B"
                value={bkashRef}
                onChange={(e) => setBkashRef(e.target.value)}
                className="font-mono"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                Your ticket will be confirmed after manual payment verification (usually within a few hours).
              </p>
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={isPending || !bkashRef.trim()}
            >
              {isPending ? "Submitting..." : `Submit Ticket Request — ৳${total}`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BuyTicketDialog;
