import { db } from "@/lib/db";

export const getUserNotifications = async (userId: string) => {
  try {
    const notifications = await db.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 30,
    });

    return notifications;
  } catch {
    return null;
  }
};
