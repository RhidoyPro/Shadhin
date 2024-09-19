import { db } from "@/lib/db";

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

export const getTopUsers = async () => {
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
    },

    orderBy: {
      points: "desc",
    },
    take: 7,
  });

  return users;
};

export const getAllUsersWithPoints = async () => {
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
    },

    orderBy: {
      points: "desc",
    },
  });

  return users;
};

export const getAllUsers = async () => {
  const users = await db.user.findMany();

  return users;
};
