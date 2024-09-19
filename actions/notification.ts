"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export const addNotification = async (
  message: string,
  eventId: string,
  recieverUserId: string
) => {
  console.log("addNotification");
  const session = await auth();

  if (!session) {
    return {
      error: "User not authenticated",
    };
  }

  if (!message || message.trim() === "") {
    return {
      error: "Message cannot be empty",
    };
  }

  const reciever = await db.user.findUnique({
    where: {
      id: recieverUserId,
    },
  });

  if (!reciever) {
    return {
      error: "Reciever not found",
    };
  }

  // Save the message to the database
  await db.notification.create({
    data: {
      message,
      userId: reciever.id,
      eventId,
    },
  });

  return {
    success: true,
  };
};

export const readNotification = async (notificationId: string) => {
  const session = await auth();

  if (!session) {
    return {
      error: "User not authenticated",
    };
  }

  await db.notification.update({
    where: {
      id: notificationId,
    },
    data: {
      isRead: true,
    },
  });

  return {
    success: true,
  };
};
