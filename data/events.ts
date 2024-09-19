import { db } from "@/lib/db";
import { EventStatus } from "@prisma/client";
import BangladeshStates from "./bangladesh-states";

export const getEventsByState = async (stateName: string) => {
  try {
    if (stateName === BangladeshStates[0].slug) {
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
    }
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
    return event;
  } catch {
    return null;
  }
};

export const getUserEvents = async (userId: string) => {
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
