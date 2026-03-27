"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
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
import { analytics } from "@/utils/analytics";

const TIER_KEYS = ["threeDays", "sevenDays", "fourteenDays"] as const;

const TIERS = [
  { days: 3, labelKey: TIER_KEYS[0], price: 50 },
  { days: 7, labelKey: TIER_KEYS[1], price: 100 },
  { days: 14, labelKey: TIER_KEYS[2], price: 200 },
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
  const t = useTranslations("boost");
  const tc = useTranslations("common");
  const [selectedDays, setSelectedDays] = useState<3 | 7 | 14>(7);
  const [bkashRef, setBkashRef] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selectedTier = TIERS.find((t) => t.days === selectedDays)!;

  // Track when user opens the boost dialog
  useEffect(() => {
    if (open) analytics.boostInitiated(eventId);
  }, [open, eventId]);

  const handleSubmit = () => {
    if (!bkashRef.trim() || bkashRef.trim().length < 6) {
      toast.error(t("invalidTrxId"));
      return;
    }
    startTransition(async () => {
      const res = await requestPromotion(eventId, selectedDays, bkashRef);
      if (res.error) {
        toast.error(res.error);
      } else {
        analytics.boostSubmitted(eventId, selectedDays, selectedTier.price);
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
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription className="line-clamp-2 text-sm">
            &ldquo;{eventTitle}&rdquo;
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 text-center">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {t("success")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("successDesc")}
              </p>
            </div>
            <Button className="w-full" variant="outline" onClick={() => handleOpenChange(false)}>
              {tc("close")}
            </Button>
          </div>
        ) : (
          <div className="space-y-5 py-1">
            {/* Pricing tiers */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("selectDuration")}</Label>
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
                    <span className="text-sm font-semibold">{t(tier.labelKey)}</span>
                    <span className="text-base font-bold text-primary mt-0.5">
                      ৳{tier.price}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment instructions */}
            <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-2">
              <p className="text-sm font-medium">{t("paymentInstructions")}</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>
                  Send <span className="font-semibold text-foreground">৳{selectedTier.price}</span> to bKash number{" "}
                  <span className="font-mono font-semibold text-foreground">{BKASH_NUMBER}</span>
                </li>
                <li>{t("sendMoneyNote")}</li>
                <li>{t("pasteTrxId")}</li>
              </ol>
            </div>

            {/* bKash reference input */}
            <div className="space-y-1.5">
              <Label htmlFor="bkash-ref" className="text-sm font-medium">
                {t("bkashTrxId")}
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
                {t("verificationNote")}
              </p>
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={isPending || !bkashRef.trim()}
            >
              {isPending ? tc("submitting") : `${t("submit")} — ৳${selectedTier.price}`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BoostPostDialog;
