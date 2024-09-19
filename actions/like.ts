"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

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
    revalidatePath("/events/[stateName]", "page");
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

  revalidatePath("/events/[stateName]", "page");

  return {
    success: true,
  };
};
