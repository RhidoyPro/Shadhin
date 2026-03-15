"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const addNotification = async (
  message: string,
  eventId: string,
  recieverUserId: string
) => {
  const session = await auth();

  if (!session) {
    return { error: "User not authenticated" };
  }

  // Don't allow users to spam-notify others
  const limited = await rateLimit(`notification:${session.user.id}`, {
    limit: 20,
    windowSeconds: 60,
  });
  if (limited.limited) {
    return { error: "Too many notifications. Slow down." };
  }

  if (!message || message.trim() === "") {
    return { error: "Message cannot be empty" };
  }

  if (message.length > 200) {
    return { error: "Notification message too long" };
  }

  // Verify the event exists
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return { error: "Event not found" };
  }

  // Don't notify yourself
  if (session.user.id === recieverUserId) {
    return { error: "Cannot notify yourself" };
  }

  const reciever = await db.user.findUnique({ where: { id: recieverUserId } });
  if (!reciever) {
    return { error: "Reciever not found" };
  }

  await db.notification.create({
    data: {
      message,
      userId: reciever.id,
      eventId,
    },
  });

  return { success: true };
};

export const readNotification = async (notificationId: string) => {
  const session = await auth();

  if (!session) {
    return { error: "User not authenticated" };
  }

  const notification = await db.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== session.user.id) {
    return { error: "Unauthorized" };
  }

  await db.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  return { success: true };
};
