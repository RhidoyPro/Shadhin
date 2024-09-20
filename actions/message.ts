"use server";

import { auth } from "@/auth";
import { getMessagesByStateName } from "@/data/messages";
import { db } from "@/lib/db";

export const addMessage = async (message: string, stateName: string) => {
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

  // Save the message to the database
  await db.message.create({
    data: {
      message,
      userId: session.user.id!,
      stateName,
    },
  });

  return {
    success: true,
  };
};

export const fetchMessages = async (
  stateName: string,
  page?: number,
  limit?: number
) => {
  const messages = await getMessagesByStateName(stateName, page, limit);
  return messages;
};
