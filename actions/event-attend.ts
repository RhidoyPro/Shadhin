"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { EventStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export const markAsAttending = async (eventId: string) => {
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

  // Check if the user has already marked the event as attending
  const existingAttendee = await db.eventAttendee.findFirst({
    where: {
      eventId,
      userId: session.user.id!,
      status: EventStatus.GOING,
    },
  });

  // If the user has already marked the event as attending, unmark it
  if (existingAttendee) {
    await db.eventAttendee.delete({
      where: {
        id: existingAttendee.id,
      },
    });

    //we need to decrement the point of the user
    await db.user.update({
      where: {
        id: session.user.id!,
      },
      data: {
        points: {
          decrement: 1,
        },
      },
    });

    revalidatePath("/events/[stateName]", "page");
    return {
      success: true,
    };
  }

  // check if the user has marked the event as not attending
  const existingNotAttendee = await db.eventAttendee.findFirst({
    where: {
      eventId,
      userId: session.user.id!,
      status: EventStatus.NOT_GOING,
    },
  });

  // If the user has already marked the event as not attending, unmark it
  if (existingNotAttendee) {
    await db.eventAttendee.delete({
      where: {
        id: existingNotAttendee.id,
      },
    });
  }

  // Save the attendee to the database
  await db.eventAttendee.create({
    data: {
      status: EventStatus.GOING,
      eventId,
      userId: session.user.id!,
    },
  });

  //we need to increment the point of the user
  const user = await db.user.update({
    where: {
      id: session.user.id!,
    },
    data: {
      points: {
        increment: 1,
      },
    },
  });
  console.log(user);

  revalidatePath("/events/[stateName]", "page");
  return {
    success: true,
  };
};

export const markAsNotAttending = async (eventId: string) => {
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

  // Check if the user has already marked the event as not attending
  const existingAttendee = await db.eventAttendee.findFirst({
    where: {
      eventId,
      userId: session.user.id!,
      status: EventStatus.NOT_GOING,
    },
  });

  // If the user has already marked the event as not attending, unmark it
  if (existingAttendee) {
    await db.eventAttendee.delete({
      where: {
        id: existingAttendee.id,
      },
    });

    revalidatePath("/events/[stateName]", "page");
    return {
      success: true,
    };
  }

  // check if the user has marked the event as attending
  const existingNotAttendee = await db.eventAttendee.findFirst({
    where: {
      eventId,
      userId: session.user.id!,
      status: EventStatus.GOING,
    },
  });

  // If the user has already marked the event as attending, unmark it
  if (existingNotAttendee) {
    await db.eventAttendee.delete({
      where: {
        id: existingNotAttendee.id,
      },
    });

    //we need to decrement the point of the user
    await db.user.update({
      where: {
        id: session.user.id!,
      },
      data: {
        points: {
          decrement: 1,
        },
      },
    });
  }

  // Save the attendee to the database
  await db.eventAttendee.create({
    data: {
      status: EventStatus.NOT_GOING,
      eventId,
      userId: session.user.id!,
    },
  });

  revalidatePath("/events/[stateName]", "page");
  return {
    success: true,
  };
};
