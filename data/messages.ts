import { db } from "@/lib/db";

export const getMessagesByStateName = async (
  stateName: string,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;
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
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    //now we will sort the messages in ascending order
    messages.sort((a, b) => {
      if (a.createdAt < b.createdAt) {
        return -1;
      }
      if (a.createdAt > b.createdAt) {
        return 1;
      }
      return 0;
    });

    return messages;
  } catch {
    return null;
  }
};
