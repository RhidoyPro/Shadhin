import { db } from "@/lib/db";
import { EventStatus } from "@prisma/client";

export const isUserAttendingEvent = async (eventId: string, userId: string) => {
  const count = await db.eventAttendee.count({
    where: {
      eventId,
      userId,
      status: EventStatus.GOING,
    },
  });

  return count > 0;
};

export const isUserNotAttendingEvent = async (
  eventId: string,
  userId: string
) => {
  const count = await db.eventAttendee.count({
    where: {
      eventId,
      userId,
      status: EventStatus.NOT_GOING,
    },
  });

  return count > 0;
};
