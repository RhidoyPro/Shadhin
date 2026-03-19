import React from "react";
import { db } from "@/lib/db";
import { TicketsTable } from "./tickets-table";

const TicketsPage = async () => {
  const tickets = await db.ticket.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      event: { select: { id: true, content: true, stateName: true, ticketPrice: true } },
    },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ticket Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review ticket purchase requests. Verify bKash payment before approving. Platform takes 5% — organiser receives the rest.
        </p>
      </div>
      <TicketsTable tickets={tickets} />
    </div>
  );
};

export default TicketsPage;
