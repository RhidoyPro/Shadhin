"use server";

import { auth } from "@/auth";
import BangladeshStates from "@/data/bangladesh-states";
import {
  getEventById,
  getEventsByStatePaginated,
  getRankedEventsByState,
  getUserEvents,
} from "@/data/events";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { moderateText } from "@/lib/moderation";
import { sendEventEmails } from "@/lib/mail";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { EventStatus, EventType, UserRole } from "@prisma/client";
import crypto from "crypto";
import { invalidateFeedCache } from "@/lib/cache";
import { isAdminLevel } from "@/lib/roles";
import { revalidatePath } from "next/cache";
import { s3 } from "@/lib/s3";

const VALID_STATE_SLUGS = BangladeshStates.map((s) => s.slug);

const generateFileName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

const acceptedFileTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
  "video/mp4",
  "video/mkv",
  "video/webm",
  "video/avi",
  "video/mov",
  "video/flv",
  "video/wmv",
];

const maxFileSize = 1024 * 1024 * 10; //10MB

export const getSignedURL = async (
  fileType: string,
  fileSize: number,
  checkSum: string
) => {
  const session = await auth();

  if (!session) {
    return {
      error: "User not authenticated",
    };
  }

  if (!acceptedFileTypes.includes(fileType)) {
    return {
      error: "Invalid file type",
    };
  }

  if (fileSize > maxFileSize) {
    return {
      error: "File size too large",
    };
  }

  const key = generateFileName();

  const putObjectCommand = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
    ContentType: fileType,
    ContentLength: fileSize,
    Metadata: {
      userId: session.user.id!,
    },
  });

  const signedUrl = await getSignedUrl(s3, putObjectCommand, {
    expiresIn: 60, //expires in 60 seconds
  });

  return {
    success: {
      url: signedUrl,
      publicUrl: `${process.env.R2_PUBLIC_URL}/${key}`,
    },
  };
};

type CreateEventInput = {
  content: string;
  type?: "image" | "video" | undefined;
  url?: string;
  stateName: string;
  eventType: EventType;
  eventDate?: string;
  ticketPrice?: number;
  maxAttendees?: number;
};

export const createEvent = async ({
  content,
  type,
  url,
  stateName,
  eventType,
  eventDate,
  ticketPrice,
  maxAttendees,
}: CreateEventInput) => {
  const session = await auth();

  if (!session) {
    return {
      error: "User not authenticated",
    };
  }

  const limited = await rateLimit(`create-event:${session.user.id}`, {
    limit: 10,
    windowSeconds: 300,
  });
  if (limited.limited) {
    return { error: "Too many posts. Please slow down." };
  }

  if (!content || content?.trim() === "") {
    return { error: "Content cannot be empty" };
  }

  if (content.length > 2000) {
    return { error: "Content cannot exceed 2000 characters" };
  }

  if (!VALID_STATE_SLUGS.includes(stateName)) {
    return { error: "Invalid district selected" };
  }

  // Content moderation check
  const moderation = await moderateText(content);
  if (moderation.flagged) {
    return { error: `Content flagged for: ${moderation.categories.join(", ")}. Please revise your post.` };
  }

  //we need to check if the stateName is all-districts and the user is a normal user, we throw an error
  if (
    stateName === BangladeshStates[0].slug &&
    session?.user?.role === UserRole.USER
  ) {
    return {
      error: "Unauthorized! You can't post to all districts",
    };
  }

  // Save the event to the database
  const event = await db.event.create({
    data: {
      content,
      type,
      mediaUrl: url,
      userId: session.user.id!,
      stateName,
      eventType,
      eventDate: eventDate ? new Date(eventDate) : undefined,
      ticketPrice: ticketPrice ?? null,
      maxAttendees: maxAttendees ?? null,
    },
  });

  // Invalidate feed cache for this state
  invalidateFeedCache(stateName).catch(() => {});

  if (eventType === EventType.EVENT) {
    //then send email to all users
    let userEmails: string[] = [];
    if (stateName === BangladeshStates[0].slug) {
      const users = await db.user.findMany({
        where: {
          emailVerified: {
            not: null,
          },
        },
      });

      userEmails = users.map((user) => user?.email as string);
    } else {
      const users = await db.user.findMany({
        where: {
          emailVerified: {
            not: null,
          },
          stateName,
        },
      });

      userEmails = users.map((user) => user?.email as string);
    }

    // Send email to all users in the state (fire-and-forget)
    sendEventEmails(userEmails, {
      stateName,
      id: event.id,
      createdAt: event.createdAt,
      createdBy: session.user.name as string,
    }).catch(console.error);
  }

  revalidatePath("/events/[stateName]", "page");

  return {
    success: true,
  };
};

export const editEvent = async (eventId: string, content: string) => {
  const session = await auth();

  if (!session) {
    return { error: "User not authenticated" };
  }

  if (!content || content.trim() === "") {
    return { error: "Content cannot be empty" };
  }

  if (content.length > 2000) {
    return { error: "Content cannot exceed 2000 characters" };
  }

  const moderation = await moderateText(content);
  if (moderation.flagged) {
    return { error: `Content flagged for: ${moderation.categories.join(", ")}. Please revise.` };
  }

  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return { error: "Event not found" };
  }

  if (event.userId !== session.user.id) {
    return { error: "Unauthorized" };
  }

  await db.event.update({
    where: { id: eventId },
    data: { content: content.trim() },
  });

  revalidatePath("/events/[stateName]", "page");
  revalidatePath("/events/details/[eventId]", "page");
  invalidateFeedCache(event.stateName).catch(() => {});

  return { success: true };
};

export const deleteEvent = async (eventId: string) => {
  const session = await auth();

  if (!session) {
    return {
      error: "User not authenticated",
    };
  }

  if (!isAdminLevel(session.user.role)) {
    return {
      error: "Unauthorized",
    };
  }

  try {
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

    if (event.mediaUrl) {
      const deleteObjectCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: event.mediaUrl?.split("/").pop() as string,
      });

      await s3.send(deleteObjectCommand);
    }

    // Delete the event from the database
    await db.event.delete({
      where: {
        id: eventId,
      },
    });

    invalidateFeedCache(event.stateName).catch(() => {});
    revalidatePath("/admin/events", "page");

    return {
      success: true,
      message: "Event deleted successfully",
    };
  } catch {
    return {
      error: "Something went wrong",
    };
  }
};

export const fetchEvents = async (
  stateName: string,
  page?: number,
  limit?: number
) => {
  const session = await auth();
  const userId = session?.user?.id;
  const events =
    (await getRankedEventsByState(stateName, userId, page, limit)) || [];

  return events.map((event) => ({
    ...event,
    isLikedByUser: userId
      ? !!event.likes.find((like) => like.userId === userId)
      : false,
    isUserAttending: userId
      ? !!event.attendees.find(
          (a) => a.userId === userId && a.status === EventStatus.GOING
        )
      : false,
    isUserNotAttending: userId
      ? !!event.attendees.find(
          (a) => a.userId === userId && a.status === EventStatus.NOT_GOING
        )
      : false,
  }));
};

export const fetchUserEvents = async (
  userId: string,
  page?: number,
  limit?: number
) => {
  const session = await auth();
  const viewerId = session?.user?.id;
  const events = (await getUserEvents(userId, page, limit)) || [];

  return events.map((event) => ({
    ...event,
    isLikedByUser: viewerId
      ? !!event.likes.find((like) => like.userId === viewerId)
      : false,
    isUserAttending: viewerId
      ? !!event.attendees.find(
          (a) => a.userId === viewerId && a.status === EventStatus.GOING
        )
      : false,
    isUserNotAttending: viewerId
      ? !!event.attendees.find(
          (a) => a.userId === viewerId && a.status === EventStatus.NOT_GOING
        )
      : false,
  }));
};

export const fetchEventById = async (eventId: string) => {
  const session = await auth();
  const event = await getEventById(eventId);
  if (!event) {
    return null;
  }
  const isLikedByUser = event.likes.find(
    (like) => like.userId === session?.user?.id
  );
  const isUserAttending = event.attendees.find(
    (attendee) =>
      attendee.userId === session?.user?.id &&
      attendee.status === EventStatus.GOING
  );
  const isUserNotAttending = event.attendees.find(
    (attendee) =>
      attendee.userId === session?.user?.id &&
      attendee.status === EventStatus.NOT_GOING
  );

  return {
    ...event,
    isLikedByUser: !!isLikedByUser,
    isUserAttending: !!isUserAttending,
    isUserNotAttending: !!isUserNotAttending,
  };
};

export const fetchEventData = async (eventId: string) => {
  const session = await auth();
  const event = await getEventById(eventId);
  if (!event) return null;

  const uid = session?.user?.id;
  return {
    ...event,
    isLikedByUser: uid ? event.likes.some((l) => l.userId === uid) : false,
    isUserAttending: uid
      ? event.attendees.some((a) => a.userId === uid && a.status === EventStatus.GOING)
      : false,
    isUserNotAttending: uid
      ? event.attendees.some((a) => a.userId === uid && a.status === EventStatus.NOT_GOING)
      : false,
  };
};

export const deleteEventByUser = async (eventId: string) => {
  const session = await auth();

  if (!session) {
    return {
      error: "User not authenticated",
    };
  }

  try {
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

    if (event.userId !== session.user.id) {
      return {
        error: "Unauthorized",
      };
    }

    if (event.mediaUrl) {
      const deleteObjectCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: event.mediaUrl?.split("/").pop() as string,
      });

      await s3.send(deleteObjectCommand);
    }

    // Delete the event from the database
    await db.event.delete({
      where: {
        id: eventId,
      },
    });

    invalidateFeedCache(event.stateName).catch(() => {});

    return {
      success: true,
      message: "Event deleted successfully",
    };
  } catch {
    return {
      error: "Something went wrong",
    };
  }
};
