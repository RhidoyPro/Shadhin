import { db } from "@/lib/db";
import { getCached, setCache } from "@/lib/cache";
import { EventStatus } from "@prisma/client";
import { buildViewerContext, rankEvents } from "@/lib/feed-algorithm";

// Raw event pool fetched per state — large enough to rank across all pages
const POOL_SIZE = 100;
// Viewer context (follow list + home state) cached per user
const VIEWER_CTX_TTL = 30 * 60; // 30 minutes

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
        user: { select: { id: true, name: true, image: true, email: true, role: true, isVerifiedOrg: true } },
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
        user: { select: { id: true, name: true, image: true, email: true, role: true, isVerifiedOrg: true } },
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
        user: { select: { id: true, name: true, image: true, email: true, role: true, isVerifiedOrg: true } },
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
        user: { select: { id: true, name: true, image: true, email: true, role: true, isVerifiedOrg: true } },
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
        user: { select: { id: true, name: true, image: true, email: true, role: true, isVerifiedOrg: true } },
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
 *
 * Caching strategy:
 *   feed-pool:{stateName}   — raw event pool, 5 min TTL, shared across all pages
 *   viewer-ctx:{userId}     — follow list + home state, 30 min TTL
 */
export const getRankedEventsByState = async (
  stateName: string,
  userId: string | undefined | null,
  page: number = 1,
  limit: number = 10
) => {
  try {
    // ── 1. Event pool (shared across all pages for this state) ─────────────
    const poolKey = `feed-pool:${stateName}`;
    const dbFetchPool = () =>
      db.event.findMany({
        where: { stateName },
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, image: true, email: true, role: true, isVerifiedOrg: true } },
          likes: { select: { id: true, userId: true } },
          attendees: {
            where: { status: EventStatus.GOING },
            select: { id: true, userId: true, status: true },
          },
          comments: { select: { id: true } },
          _count: { select: { comments: true } },
        },
        take: POOL_SIZE,
      });

    type FeedEvent = Awaited<ReturnType<typeof dbFetchPool>>[number];
    let pool = await getCached<FeedEvent[]>(poolKey);
    if (!pool) {
      pool = await dbFetchPool();
      setCache(poolKey, pool).catch(() => {}); // default FEED_TTL = 5 min
    }

    const skip = (page - 1) * limit;

    if (!userId) {
      return pool.slice(skip, skip + limit);
    }

    // ── 2. Viewer context (follow list + home state, cached per user) ──────
    const ctxKey = `viewer-ctx:${userId}`;
    type ViewerData = { followingUserIds: string[]; stateName: string | null };
    let viewerData = await getCached<ViewerData>(ctxKey);
    if (!viewerData) {
      const [follows, viewer] = await Promise.all([
        db.follow.findMany({
          where: { followerId: userId },
          select: { followingId: true },
        }),
        db.user.findUnique({
          where: { id: userId },
          select: { stateName: true },
        }),
      ]);
      viewerData = {
        followingUserIds: follows.map((f) => f.followingId),
        stateName: viewer?.stateName ?? null,
      };
      setCache(ctxKey, viewerData, VIEWER_CTX_TTL).catch(() => {});
    }

    const ctx = buildViewerContext(userId, viewerData);
    return rankEvents(pool, ctx).slice(skip, skip + limit);
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
        user: { select: { id: true, name: true, image: true, email: true, role: true, isVerifiedOrg: true } },
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
