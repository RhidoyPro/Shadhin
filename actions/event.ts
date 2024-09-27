"use server";

import { auth } from "@/auth";
import BangladeshStates from "@/data/bangladesh-states";
import {
  getEventById,
  getEventsByStatePaginated,
  getUserEvents,
} from "@/data/events";
import { db } from "@/lib/db";
import { sendEventEmails } from "@/lib/mail";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { EventStatus, EventType, UserRole } from "@prisma/client";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

const generateFileName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

const s3 = new S3Client({
  region: process.env.AWS_BUCKET_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

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

  const putObjectCommand = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: generateFileName(),
    ContentType: fileType,
    ContentLength: fileSize,
    ChecksumSHA256: checkSum,
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
    },
  };
};

type CreateEventInput = {
  content: string;
  type?: "image" | "video" | undefined;
  url?: string;
  stateName: string;
  eventType: EventType;
};

export const createEvent = async ({
  content,
  type,
  url,
  stateName,
  eventType,
}: CreateEventInput) => {
  const session = await auth();

  if (!session) {
    return {
      error: "User not authenticated",
    };
  }

  if (!content || content?.trim() === "") {
    return {
      error: "Content cannot be empty",
    };
  }

  //we need to check if the stateName is all-states and the user is a normal user, we throw an error
  if (
    stateName === BangladeshStates[0].slug &&
    session?.user?.role === UserRole.USER
  ) {
    return {
      error: "Unauthorized! You can't post to all states",
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
    },
  });

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

    // Send email to all users in the state
    await sendEventEmails(userEmails, {
      stateName,
      id: event.id,
      createdAt: event.createdAt,
      createdBy: session.user.name as string,
    });
  }

  revalidatePath("/events/[stateName]", "page");

  return {
    success: true,
  };
};

export const deleteEvent = async (eventId: string) => {
  const session = await auth();

  if (!session) {
    return {
      error: "User not authenticated",
    };
  }

  if (session.user.role !== UserRole.ADMIN) {
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
  const events =
    (await getEventsByStatePaginated(stateName, page, limit)) || [];
  //we need to add isLiked, isAttending, isNotAttending to the event object
  if (session?.user) {
    const eventsWithUserData = await Promise.all(
      events.map(async (event) => {
        const isLikedByUser = event.likes.find(
          (like) => like.userId === session.user.id
        );
        const isUserAttending = event.attendees.find(
          (attendee) =>
            attendee.userId === session.user.id &&
            attendee.status === EventStatus.GOING
        );
        const isUserNotAttending = event.attendees.find(
          (attendee) =>
            attendee.userId === session.user.id &&
            attendee.status === EventStatus.NOT_GOING
        );
        return {
          ...event,
          isLikedByUser: !!isLikedByUser,
          isUserAttending: !!isUserAttending,
          isUserNotAttending: !!isUserNotAttending,
        };
      })
    );

    return eventsWithUserData;
  }
  return [];
};

export const fetchUserEvents = async (
  userId: string,
  page?: number,
  limit?: number
) => {
  const session = await auth();
  const events = (await getUserEvents(userId, page, limit)) || [];
  if (session?.user) {
    const eventsWithUserData = await Promise.all(
      events.map(async (event) => {
        const isLikedByUser = event.likes.find(
          (like) => like.userId === session.user.id
        );
        const isUserAttending = event.attendees.find(
          (attendee) =>
            attendee.userId === session.user.id &&
            attendee.status === EventStatus.GOING
        );
        const isUserNotAttending = event.attendees.find(
          (attendee) =>
            attendee.userId === session.user.id &&
            attendee.status === EventStatus.NOT_GOING
        );
        return {
          ...event,
          isLikedByUser: !!isLikedByUser,
          isUserAttending: !!isUserAttending,
          isUserNotAttending: !!isUserNotAttending,
        };
      })
    );

    return eventsWithUserData;
  }
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
  const isLikedByUser = await db.like.findFirst({
    where: {
      eventId,
      userId: session?.user?.id,
    },
  });
  const isUserAttending = await db.eventAttendee.findFirst({
    where: {
      eventId,
      userId: session?.user?.id,
      status: EventStatus.GOING,
    },
  });
  const isUserNotAttending = await db.eventAttendee.findFirst({
    where: {
      eventId,
      userId: session?.user?.id,
      status: EventStatus.NOT_GOING,
    },
  });

  return {
    ...event,
    isLikedByUser: !!isLikedByUser,
    isUserAttending: !!isUserAttending,
    isUserNotAttending: !!isUserNotAttending,
  };
};
