import { db } from "@/lib/db";

export const getCommentsByEventId = async (
  eventId: string,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;
  try {
    const comments = await db.comment.findMany({
      where: {
        eventId,
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

    return comments;
  } catch {
    return null;
  }
};
