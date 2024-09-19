import { db } from "@/lib/db";
import { EventStatus } from "@prisma/client";

export const isUserAttendingEvent = async (eventId: string, userId: string) => {
  const attendee = await db.eventAttendee.findFirst({
    where: {
      eventId,
      userId,
      status: EventStatus.GOING,
    },
  });

  return Boolean(attendee);
};

export const isUserNotAttendingEvent = async (
  eventId: string,
  userId: string
) => {
  const attendee = await db.eventAttendee.findFirst({
    where: {
      eventId,
      userId,
      status: EventStatus.NOT_GOING,
    },
  });

  return Boolean(attendee);
};
