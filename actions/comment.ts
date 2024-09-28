"use server";

import { auth } from "@/auth";
import { getCommentsByEventId } from "@/data/comments";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export const addComment = async (eventId: string, content: string) => {
  const session = await auth();

  if (!session) {
    return {
      error: "User not authenticated",
    };
  }

  // Check if the event exists
  const event = await db.event.findUnique({
    where: {
      id: eventId,
    },
  });

  if (!event) {
    return {
      error: "Event not found",
    };
  }

  // Save the comment to the database

  const comment = await db.comment.create({
    data: {
      eventId,
      userId: session.user.id!,
      content,
    },
  });

  revalidatePath("/events/details/[eventId]", "page");

  return {
    success: true,
    comment,
  };
};

export const fetchEventComments = async (
  eventId: string,
  page?: number,
  limit?: number
) => {
  const comments = await getCommentsByEventId(eventId, page, limit);
  return comments;
};

export const deleteComment = async (commentId: string) => {
  const session = await auth();

  if (!session) {
    return {
      error: "User not authenticated",
    };
  }

  const comment = await db.comment.findUnique({
    where: {
      id: commentId,
    },
  });

  if (!comment) {
    return {
      error: "Comment not found",
    };
  }

  if (comment.userId !== session.user.id) {
    return {
      error: "Unauthorized",
    };
  }

  await db.comment.delete({
    where: {
      id: commentId,
    },
  });

  revalidatePath("/events/details/[eventId]", "page");

  return {
    success: true,
  };
};
