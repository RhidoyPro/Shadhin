"use client";

import React, { useState, useTransition } from "react";
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
import { requestPromotion } from "@/actions/promotion";
import { cn } from "@/lib/utils";

const TIERS = [
  { days: 3, label: "3 Days", price: 50 },
  { days: 7, label: "7 Days", price: 100 },
  { days: 14, label: "14 Days", price: 200 },
] as const;

const BKASH_NUMBER =
  process.env.NEXT_PUBLIC_BKASH_NUMBER || "01700000000";

type Props = {
  eventId: string;
  eventTitle: string;
  open: boolean;
  onClose: () => void;
};

const BoostPostDialog = ({ eventId, eventTitle, open, onClose }: Props) => {
  const [selectedDays, setSelectedDays] = useState<3 | 7 | 14>(7);
  const [bkashRef, setBkashRef] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedTier = TIERS.find((t) => t.days === selectedDays)!;

  const handleSubmit = () => {
    if (!bkashRef.trim() || bkashRef.trim().length < 6) {
      toast.error("Please enter a valid bKash transaction reference (min 6 chars).");
      return;
    }
    startTransition(async () => {
      const res = await requestPromotion(eventId, selectedDays, bkashRef);
      if (res.error) {
        toast.error(res.error);
      } else {
        setSubmitted(true);
      }
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      // Reset state on close after a short delay
      setTimeout(() => {
        setBkashRef("");
        setSubmitted(false);
        setSelectedDays(7);
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Boost Post</DialogTitle>
          <DialogDescription className="line-clamp-2 text-sm">
            &ldquo;{eventTitle}&rdquo;
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 text-center">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Request submitted!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Your boost request is under review. We&apos;ll activate it once the payment is verified.
              </p>
            </div>
            <Button className="w-full" variant="outline" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-5 py-1">
            {/* Pricing tiers */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Duration</Label>
              <div className="grid grid-cols-3 gap-2">
                {TIERS.map((tier) => (
                  <button
                    key={tier.days}
                    type="button"
                    onClick={() => setSelectedDays(tier.days)}
                    className={cn(
                      "flex flex-col items-center rounded-xl border p-3 text-center transition-all",
                      selectedDays === tier.days
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <span className="text-sm font-semibold">{tier.label}</span>
                    <span className="text-base font-bold text-primary mt-0.5">
                      ৳{tier.price}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment instructions */}
            <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-2">
              <p className="text-sm font-medium">Payment Instructions</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>
                  Send <span className="font-semibold text-foreground">৳{selectedTier.price}</span> to bKash number{" "}
                  <span className="font-mono font-semibold text-foreground">{BKASH_NUMBER}</span>
                </li>
                <li>Use &ldquo;Send Money&rdquo; (not payment)</li>
                <li>Copy the TrxID from your bKash confirmation SMS</li>
                <li>Paste it below and submit</li>
              </ol>
            </div>

            {/* bKash reference input */}
            <div className="space-y-1.5">
              <Label htmlFor="bkash-ref" className="text-sm font-medium">
                bKash TrxID
              </Label>
              <Input
                id="bkash-ref"
                placeholder="e.g. 8N5J2K3A4B"
                value={bkashRef}
                onChange={(e) => setBkashRef(e.target.value)}
                className="font-mono"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                Your request will be approved after manual payment verification (usually within a few hours).
              </p>
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={isPending || !bkashRef.trim()}
            >
              {isPending ? "Submitting..." : `Submit Boost Request — ৳${selectedTier.price}`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BoostPostDialog;
