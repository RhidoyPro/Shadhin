import { db } from "@/lib/db";

export const getMessagesByStateName = async (stateName: string) => {
  try {
    const messages = await db.message.findMany({
      where: {
        stateName,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return messages;
  } catch {
    return null;
  }
};
