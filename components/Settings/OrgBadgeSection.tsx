"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import ApplyOrgBadgeDialog from "@/components/Shared/ApplyOrgBadgeDialog";
import { BadgeCheck } from "lucide-react";

const OrgBadgeSection = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <BadgeCheck className="h-4 w-4" />
        Apply for Verified Badge
      </Button>
      <ApplyOrgBadgeDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default OrgBadgeSection;
