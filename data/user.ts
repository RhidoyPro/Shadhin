import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";

export const getUserByEmail = async (email: string) => {
  try {
    const user = await db.user.findUnique({
      where: {
        email,
      },
    });

    return user;
  } catch {
    return null;
  }
};

export const getUserByPhone = async (phone: string) => {
  try {
    const user = await db.user.findFirst({
      where: {
        phone,
      },
    });

    return user;
  } catch {
    return null;
  }
};

export const getUserById = async (id: string) => {
  try {
    const user = await db.user.findUnique({
      where: {
        id,
      },
    });

    return user;
  } catch {
    return null;
  }
};

export const getTopUsers = unstable_cache(
  async () => {
    const users = await db.user.findMany({
      where: {
        points: {
          gt: 0,
        },
      },
      select: {
        id: true,
        name: true,
        image: true,
        points: true,
        previousPoints: true,
        role: true,
        isVerifiedOrg: true,
      },
      orderBy: {
        points: "desc",
      },
      take: 7,
    });
    return users;
  },
  ["top-users"],
  { revalidate: 300, tags: ["leaderboard"] }
);

export const getAllUsersWithPointsPaginated = unstable_cache(
  async (page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;
    const users = await db.user.findMany({
      where: {
        points: {
          gt: 0,
        },
      },
      select: {
        id: true,
        name: true,
        image: true,
        points: true,
        role: true,
        isVerifiedOrg: true,
      },
      orderBy: {
        points: "desc",
      },
      skip,
      take: limit,
    });
    return users;
  },
  ["leaderboard-paginated"],
  { revalidate: 300, tags: ["leaderboard"] }
);

export const getAllUsers = async () => {
  const users = await db.user.findMany();

  return users;
};

export const searchUsersAndEvents = async (query: string) => {
  if (!query || query.trim().length < 2) return { users: [], events: [] };

  const trimmed = query.trim();

  const [users, events] = await Promise.all([
    db.user.findMany({
      where: {
        OR: [
          { name: { contains: trimmed, mode: "insensitive" } },
          { university: { contains: trimmed, mode: "insensitive" } },
          { stateName: { contains: trimmed, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        image: true,
        stateName: true,
        university: true,
        role: true,
        isVerifiedOrg: true,
      },
      take: 10,
    }),
    db.event.findMany({
      where: {
        content: { contains: trimmed, mode: "insensitive" },
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, image: true, role: true, isVerifiedOrg: true },
        },
      },
      take: 10,
    }),
  ]);

  return { users, events };
};

export const getFollowCounts = async (userId: string) => {
  const [followers, following] = await Promise.all([
    db.follow.count({ where: { followingId: userId } }),
    db.follow.count({ where: { followerId: userId } }),
  ]);
  return { followers, following };
};

export const isFollowing = async (
  followerId: string,
  followingId: string
): Promise<boolean> => {
  const follow = await db.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  return !!follow;
};
