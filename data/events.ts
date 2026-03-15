import { db } from "@/lib/db";
import { EventStatus } from "@prisma/client";
import {
  buildViewerContext,
  rankEvents,
  FEED_CONFIG,
} from "@/lib/feed-algorithm";

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
        user: { select: { id: true, name: true, image: true, email: true } },
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
        user: { select: { id: true, name: true, image: true, email: true } },
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
        user: { select: { id: true, name: true, image: true, email: true } },
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
    return event;
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
        user: { select: { id: true, name: true, image: true, email: true } },
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

export const getEventsUserIsAttending = async (
  userId: string,
  limit: number = 5
) => {
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
        user: { select: { id: true, name: true, image: true, email: true } },
        likes: { select: { id: true } },
        attendees: {
          where: { status: EventStatus.GOING },
          select: { id: true },
        },
        comments: { select: { id: true } },
      },
      take: limit,
    });
    return events;
  } catch {
    return null;
  }
};

export const countEventsUserIsAttending = async (userId: string) => {
  try {
    return await db.eventAttendee.count({
      where: { userId, status: EventStatus.GOING },
    });
  } catch {
    return 0;
  }
};

/**
 * Fetch events for a state, ranked by the feed algorithm.
 * Falls back to chronological order for unauthenticated viewers.
 */
export const getRankedEventsByState = async (
  stateName: string,
  userId: string | undefined | null,
  page: number = 1,
  limit: number = 10
) => {
  try {
    const fetchLimit = limit * FEED_CONFIG.fetchMultiplier;
    const skip = (page - 1) * limit;

    // Fetch a larger pool to rank from
    const events = await db.event.findMany({
      where: { stateName },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, image: true, email: true } },
        likes: { select: { id: true, userId: true } },
        attendees: {
          where: { status: EventStatus.GOING },
          select: { id: true, userId: true, status: true },
        },
        comments: { select: { id: true } },
      },
      skip,
      take: fetchLimit,
    });

    if (!userId) {
      return events.slice(0, limit);
    }

    // Build viewer context from their interaction history
    const [likedEvents, commentedEvents, attendedEvents, viewer] =
      await Promise.all([
        db.like.findMany({
          where: { userId },
          select: { event: { select: { userId: true, stateName: true } } },
          take: 100,
        }),
        db.comment.findMany({
          where: { userId },
          select: { event: { select: { userId: true, stateName: true } } },
          take: 100,
        }),
        db.eventAttendee.findMany({
          where: { userId, status: EventStatus.GOING },
          select: { event: { select: { userId: true, stateName: true } } },
          take: 100,
        }),
        db.user.findUnique({
          where: { id: userId },
          select: { stateName: true },
        }),
      ]);

    const ctx = buildViewerContext(userId, {
      likedUserIds: likedEvents.map((l) => l.event.userId),
      commentedUserIds: commentedEvents.map((c) => c.event.userId),
      attendedUserIds: attendedEvents.map((a) => a.event.userId),
      interactedStates: [
        ...likedEvents.map((l) => l.event.stateName),
        ...commentedEvents.map((c) => c.event.stateName),
      ],
      stateName: viewer?.stateName ?? null,
    });

    return rankEvents(events, ctx).slice(0, limit);
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
        user: { select: { id: true, name: true, image: true, email: true } },
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
