"use client";

import React, { useState, useTransition, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { requestOrgVerification } from "@/actions/org-verification";
import { analytics } from "@/utils/analytics";

const BKASH_NUMBER =
  process.env.NEXT_PUBLIC_BKASH_NUMBER || "01700000000";

const ORG_TYPES = [
  "NGO",
  "Business",
  "Government",
  "Education",
  "Media",
  "Other",
] as const;

type Props = {
  open: boolean;
  onClose: () => void;
};

const ApplyOrgBadgeDialog = ({ open, onClose }: Props) => {
  const [orgName, setOrgName] = useState("");

  useEffect(() => {
    if (open) analytics.orgBadgeInitiated();
  }, [open]);
  const [orgType, setOrgType] = useState("");
  const [bkashRef, setBkashRef] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!orgName.trim()) {
      toast.error("Please enter your organisation name.");
      return;
    }
    if (!orgType) {
      toast.error("Please select an organisation type.");
      return;
    }
    if (!bkashRef.trim() || bkashRef.trim().length < 6) {
      toast.error("Please enter a valid bKash transaction reference.");
      return;
    }
    startTransition(async () => {
      const res = await requestOrgVerification(orgName, orgType, bkashRef);
      if (res.error) {
        toast.error(res.error);
      } else {
        analytics.orgBadgeSubmitted();
        setSubmitted(true);
      }
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      setTimeout(() => {
        setOrgName("");
        setOrgType("");
        setBkashRef("");
        setSubmitted(false);
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply for Verified Badge</DialogTitle>
          <DialogDescription>
            Get a verified badge for your organisation on Shadhin.io. One-time fee of ৳300.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 text-center">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Application submitted!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Your verification request is under review. We&apos;ll grant your badge once payment is confirmed.
              </p>
            </div>
            <Button className="w-full" variant="outline" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-5 py-1">
            {/* Fee & payment info */}
            <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-2">
              <p className="text-sm font-medium">Payment Instructions</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>
                  Send{" "}
                  <span className="font-semibold text-foreground">৳300</span> (one-time) to bKash number{" "}
                  <span className="font-mono font-semibold text-foreground">{BKASH_NUMBER}</span>
                </li>
                <li>Use &ldquo;Send Money&rdquo; (not payment)</li>
                <li>Copy the TrxID from your bKash confirmation SMS</li>
                <li>Fill in the form below and submit</li>
              </ol>
            </div>

            {/* Org Name */}
            <div className="space-y-1.5">
              <Label htmlFor="org-name" className="text-sm font-medium">
                Organisation Name
              </Label>
              <Input
                id="org-name"
                placeholder="e.g. Dhaka Relief Foundation"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                maxLength={120}
              />
            </div>

            {/* Org Type */}
            <div className="space-y-1.5">
              <Label htmlFor="org-type" className="text-sm font-medium">
                Organisation Type
              </Label>
              <Select value={orgType} onValueChange={setOrgType}>
                <SelectTrigger id="org-type">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {ORG_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* bKash TrxID */}
            <div className="space-y-1.5">
              <Label htmlFor="badge-bkash-ref" className="text-sm font-medium">
                bKash TrxID
              </Label>
              <Input
                id="badge-bkash-ref"
                placeholder="e.g. 8N5J2K3A4B"
                value={bkashRef}
                onChange={(e) => setBkashRef(e.target.value)}
                className="font-mono"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                Your badge will be activated after manual payment verification (usually within a few hours).
              </p>
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={isPending || !orgName.trim() || !orgType || !bkashRef.trim()}
            >
              {isPending ? "Submitting..." : "Submit Application — ৳300"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ApplyOrgBadgeDialog;
