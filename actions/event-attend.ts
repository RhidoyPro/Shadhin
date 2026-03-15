"use server";

import { auth } from "@/auth";
import {
  isUserAttendingEvent,
  isUserNotAttendingEvent,
} from "@/data/event-attend";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { EventStatus } from "@prisma/client";
import { revalidateTag } from "next/cache";

export const markAsAttending = async (eventId: string) => {
  const session = await auth();

  if (!session) {
    return { error: "User not authenticated" };
  }

  // Rate limit to prevent points farming (toggling attend/unattend rapidly)
  const limited = rateLimit(`attend:${session.user.id}:${eventId}`, {
    limit: 5,
    windowSeconds: 60,
  });
  if (limited.limited) {
    return { error: "Too many actions. Please slow down." };
  }

  const event = await db.event.findUnique({ where: { id: eventId } });

  if (!event) {
    return { error: "Event not found" };
  }

  const existingAttendee = await db.eventAttendee.findFirst({
    where: { eventId, userId: session.user.id!, status: EventStatus.GOING },
  });

  if (existingAttendee) {
    await db.eventAttendee.delete({ where: { id: existingAttendee.id } });

    const currentUser = await db.user.findUnique({
      where: { id: session.user.id! },
      select: { points: true },
    });
    if (currentUser && currentUser.points > 0) {
      await db.user.update({
        where: { id: session.user.id! },
        data: { points: { decrement: 1 } },
      });
      revalidateTag("leaderboard");
    }
    return { success: true };
  }

  const existingNotAttendee = await db.eventAttendee.findFirst({
    where: { eventId, userId: session.user.id!, status: EventStatus.NOT_GOING },
  });

  if (existingNotAttendee) {
    await db.eventAttendee.delete({ where: { id: existingNotAttendee.id } });
  }

  await db.eventAttendee.create({
    data: { status: EventStatus.GOING, eventId, userId: session.user.id! },
  });

  await db.user.update({
    where: { id: session.user.id! },
    data: { points: { increment: 1 } },
  });
  revalidateTag("leaderboard");

  return { success: true };
};

export const markAsNotAttending = async (eventId: string) => {
  const session = await auth();

  if (!session) {
    return { error: "User not authenticated" };
  }

  const limited = rateLimit(`attend:${session.user.id}:${eventId}`, {
    limit: 5,
    windowSeconds: 60,
  });
  if (limited.limited) {
    return { error: "Too many actions. Please slow down." };
  }

  const event = await db.event.findUnique({ where: { id: eventId } });

  if (!event) {
    return { error: "Event not found" };
  }

  const existingAttendee = await db.eventAttendee.findFirst({
    where: { eventId, userId: session.user.id!, status: EventStatus.NOT_GOING },
  });

  if (existingAttendee) {
    await db.eventAttendee.delete({ where: { id: existingAttendee.id } });
    return { success: true };
  }

  const existingNotAttendee = await db.eventAttendee.findFirst({
    where: { eventId, userId: session.user.id!, status: EventStatus.GOING },
  });

  if (existingNotAttendee) {
    await db.eventAttendee.delete({ where: { id: existingNotAttendee.id } });

    const currentUser = await db.user.findUnique({
      where: { id: session.user.id! },
      select: { points: true },
    });
    if (currentUser && currentUser.points > 0) {
      await db.user.update({
        where: { id: session.user.id! },
        data: { points: { decrement: 1 } },
      });
      revalidateTag("leaderboard");
    }
  }

  await db.eventAttendee.create({
    data: { status: EventStatus.NOT_GOING, eventId, userId: session.user.id! },
  });

  return { success: true };
};

export const isUserAttending = async (eventId: string, userId: string) => {
  return await isUserAttendingEvent(eventId, userId);
};

export const isUserNotAttending = async (eventId: string, userId: string) => {
  return await isUserNotAttendingEvent(eventId, userId);
};
