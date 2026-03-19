"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isAdminLevel } from "@/lib/roles";
import { revalidatePath } from "next/cache";

export const buyTicket = async (eventId: string, bkashRef: string) => {
  const session = await auth();
  if (!session) return { error: "User not authenticated" };

  if (!bkashRef || bkashRef.trim().length < 6) {
    return { error: "Please enter a valid bKash transaction reference." };
  }

  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) return { error: "Event not found" };
  if (!event.ticketPrice) return { error: "This event does not require tickets." };
  if (event.userId === session.user.id) return { error: "You cannot buy a ticket for your own event." };

  // Check if user already has a ticket (pending or approved)
  const existing = await db.ticket.findFirst({
    where: { eventId, userId: session.user.id!, status: { in: ["PENDING", "APPROVED"] } },
  });
  if (existing) return { error: "You already have a ticket or a pending request for this event." };

  // Check max attendees
  if (event.maxAttendees) {
    const approvedCount = await db.ticket.count({
      where: { eventId, status: "APPROVED" },
    });
    if (approvedCount >= event.maxAttendees) {
      return { error: "Sorry, this event is fully booked." };
    }
  }

  // 5% platform fee included in amountBDT (buyer pays full price + 5%)
  const fee = event.ticketPrice * 0.05;
  const amountBDT = Math.round((event.ticketPrice + fee) * 100) / 100;

  await db.ticket.create({
    data: {
      eventId,
      userId: session.user.id!,
      bkashRef: bkashRef.trim(),
      amountBDT,
    },
  });

  return { success: true };
};

export const approveTicket = async (ticketId: string) => {
  const session = await auth();
  if (!session || !isAdminLevel(session.user.role)) return { error: "Unauthorized" };

  const ticket = await db.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return { error: "Ticket not found" };
  if (ticket.status !== "PENDING") return { error: "Ticket is not pending" };

  await db.ticket.update({
    where: { id: ticketId },
    data: { status: "APPROVED" },
  });

  revalidatePath("/admin/tickets");
  return { success: true };
};

export const rejectTicket = async (ticketId: string, adminNote?: string) => {
  const session = await auth();
  if (!session || !isAdminLevel(session.user.role)) return { error: "Unauthorized" };

  const ticket = await db.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return { error: "Ticket not found" };
  if (ticket.status !== "PENDING") return { error: "Ticket is not pending" };

  await db.ticket.update({
    where: { id: ticketId },
    data: { status: "REJECTED", adminNote: adminNote?.trim() || null },
  });

  revalidatePath("/admin/tickets");
  return { success: true };
};
