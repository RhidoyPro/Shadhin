import React from "react";
import { db } from "@/lib/db";
import { OrgVerificationTable } from "./org-verification-table";

const OrgVerificationPage = async () => {
  const requests = await db.orgVerificationRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Org Verification Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review verified badge applications. Payment ৳300 via bKash — verify before approving.
        </p>
      </div>
      <OrgVerificationTable requests={requests} />
    </div>
  );
};

export default OrgVerificationPage;
