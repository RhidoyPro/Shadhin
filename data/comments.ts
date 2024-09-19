import { db } from "@/lib/db";

export const getCommentsByEventId = async (eventId: string) => {
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
    });

    return comments;
  } catch {
    return null;
  }
};
