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
      take: 50,
      include: {
        event: {
          select: {
            id: true,
            content: true,
            stateName: true,
            mediaUrl: true,
          },
        },
      },
    });

    return notifications;
  } catch {
    return null;
  }
};
