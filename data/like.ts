import { db } from "@/lib/db";

export const getIsLikedByUser = async (eventId: string, userId: string) => {
  const count = await db.like.count({
    where: {
      eventId,
      userId,
    },
  });

  return count > 0;
};
