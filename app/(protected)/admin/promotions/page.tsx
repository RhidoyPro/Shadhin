import React from "react";
import { db } from "@/lib/db";
import { PromotionsTable } from "./promotions-table";

const PromotionsPage = async () => {
  const requests = await db.promotionRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      event: { select: { id: true, content: true, stateName: true } },
    },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Promotion Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and approve post boost requests. Payment is via bKash — verify the reference before approving.
        </p>
      </div>
      <PromotionsTable requests={requests} />
    </div>
  );
};

export default PromotionsPage;
