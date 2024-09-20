"use server";

import { auth } from "@/auth";
import { getIsLikedByUser } from "@/data/like";
import { db } from "@/lib/db";

export const like = async (eventId: string) => {
  const session = await auth();

  if (!session) {
    return {
      error: "User not authenticated",
    };
  }

  // Check if the event exists
  const event = await db.event.findUnique({
    where: {
      id: eventId,
    },
  });

  if (!event) {
    return {
      error: "Event not found",
    };
  }

  // Check if the user has already liked the event
  const existingLike = await db.like.findFirst({
    where: {
      eventId,
      userId: session.user.id!,
    },
  });

  // If the user has already liked the event, unlike it
  if (existingLike) {
    await db.like.delete({
      where: {
        id: existingLike.id,
      },
    });
    return {
      success: true,
    };
  }

  // Save the like to the database
  await db.like.create({
    data: {
      eventId,
      userId: session.user.id!,
    },
  });

  return {
    success: true,
  };
};

export const isLikedByUser = async (eventId: string, userId: string) => {
  const isLikedByUser = await getIsLikedByUser(eventId, userId);
  return isLikedByUser;
};
