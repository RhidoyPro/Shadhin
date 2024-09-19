"use server";

import { auth } from "@/auth";
import BangladeshStates from "@/data/bangladesh-states";
import { db } from "@/lib/db";
import { sendEventEmails } from "@/lib/mail";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { UserRole } from "@prisma/client";
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
};

export const createEvent = async ({
  content,
  type,
  url,
  stateName,
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

  // Save the event to the database
  const event = await db.event.create({
    data: {
      content,
      type,
      mediaUrl: url,
      userId: session.user.id!,
      stateName,
    },
  });

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
