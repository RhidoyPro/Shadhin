import { db } from "@/lib/db";

export const getIsLikedByUser = async (eventId: string, userId: string) => {
  const like = await db.like.findFirst({
    where: {
      eventId,
      userId,
    },
  });

  return Boolean(like);
};
