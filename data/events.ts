import { db } from "@/lib/db";
import { EventStatus } from "@prisma/client";

export const getEventsByStatePaginated = async (
  stateName: string,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;
  try {
    const events = await db.event.findMany({
      where: {
        stateName,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
        likes: {
          select: {
            id: true,
            userId: true,
          },
        },
        attendees: {
          where: {
            status: EventStatus.GOING,
          },
          select: {
            id: true,
            userId: true,
            status: true,
          },
        },
        comments: {
          select: {
            id: true,
          },
        },
      },
      skip,
      take: limit,
    });
    return events;
  } catch {
    return null;
  }
};

export const getEventsByState = async (stateName: string) => {
  try {
    const events = await db.event.findMany({
      where: {
        stateName,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
        likes: {
          select: {
            id: true,
          },
        },
        attendees: {
          where: {
            status: EventStatus.GOING,
          },
          select: {
            id: true,
          },
        },
        comments: {
          select: {
            id: true,
          },
        },
      },
    });
    return events;
  } catch {
    return null;
  }
};

export const getEventById = async (eventId: string) => {
  try {
    const event = await db.event.findUnique({
      where: {
        id: eventId,
      },
      include: {
        user: true,
        likes: {
          select: {
            id: true,
            userId: true,
          },
        },
        attendees: {
          where: {
            status: EventStatus.GOING,
          },
          select: {
            id: true,
            userId: true,
            status: true,
          },
        },
        comments: {
          select: {
            id: true,
          },
        },
      },
    });
    if (!event) return null;
    const isLikedByUser = event.likes.find(
      (like) => like.userId === event.userId
    );
    const isUserAttending = event.attendees.find(
      (attendee) =>
        attendee.userId === event.userId &&
        attendee.status === EventStatus.GOING
    );
    const isUserNotAttending = event.attendees.find(
      (attendee) =>
        attendee.userId === event.userId &&
        attendee.status === EventStatus.NOT_GOING
    );
    return {
      ...event,
      isLikedByUser: !!isLikedByUser,
      isUserAttending: !!isUserAttending,
      isUserNotAttending: !!isUserNotAttending,
    };
  } catch {
    return null;
  }
};

export const getUserEvents = async (
  userId: string,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;
  try {
    const events = await db.event.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
        likes: {
          select: {
            id: true,
            userId: true,
          },
        },
        attendees: {
          where: {
            status: EventStatus.GOING,
          },
          select: {
            id: true,
            userId: true,
            status: true,
          },
        },
        comments: {
          select: {
            id: true,
          },
        },
      },
      skip,
      take: limit,
    });
    return events;
  } catch {
    return null;
  }
};

export const getEventsUserIsAttending = async (userId: string) => {
  try {
    const events = await db.event.findMany({
      where: {
        attendees: {
          some: {
            userId,
            status: EventStatus.GOING,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
        likes: {
          select: {
            id: true,
          },
        },
        attendees: {
          where: {
            status: EventStatus.GOING,
          },
          select: {
            id: true,
          },
        },
        comments: {
          select: {
            id: true,
          },
        },
      },
    });
    return events;
  } catch {
    return null;
  }
};

export const getAllEvents = async () => {
  try {
    const events = await db.event.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
        likes: {
          select: {
            id: true,
          },
        },
        attendees: {
          where: {
            status: EventStatus.GOING,
          },
          select: {
            id: true,
          },
        },
        comments: {
          select: {
            id: true,
          },
        },
      },
    });
    return events;
  } catch {
    return null;
  }
};
