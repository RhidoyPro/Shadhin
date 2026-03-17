"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export const toggleBookmark = async (eventId: string) => {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const existing = await db.bookmark.findUnique({
    where: {
      userId_eventId: {
        userId: session.user.id,
        eventId,
      },
    },
  });

  if (existing) {
    await db.bookmark.delete({ where: { id: existing.id } });
    return { bookmarked: false };
  }

  await db.bookmark.create({
    data: {
      userId: session.user.id,
      eventId,
    },
  });

  return { bookmarked: true };
};

export const getBookmarkedEvents = async (page = 1, limit = 20) => {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  const bookmarks = await db.bookmark.findMany({
    where: { userId: session.user.id },
    include: {
      event: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              role: true,
              stateName: true,
            },
          },
          likes: true,
          comments: true,
          attendees: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  return bookmarks.map((b) => ({
    ...b.event,
    bookmarkedAt: b.createdAt,
    isBookmarked: true,
  }));
};
