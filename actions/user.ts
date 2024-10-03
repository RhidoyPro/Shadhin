"use server";

import { auth } from "@/auth";
import {
  isUserAttendingEvent,
  isUserNotAttendingEvent,
} from "@/data/event-attend";
import { getIsLikedByUser } from "@/data/like";
import { getAllUsersWithPointsPaginated } from "@/data/user";
import { db } from "@/lib/db";
import { UpdateProfileSchema } from "@/utils/zodSchema";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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
];

const maxFileSize = 1024 * 1024 * 5; //5MB

export const getSignedURLForImage = async (
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

  const fileName = generateFileName();
  const Key = `profile-images/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key,
    ContentType: fileType,
    ContentLength: fileSize,
    ChecksumSHA256: checkSum,
    Metadata: {
      userId: session.user.id!,
    },
  });

  const signedUrl = await getSignedUrl(s3, command, {
    expiresIn: 60, //expires in 60 seconds
  });

  return {
    success: {
      url: signedUrl,
    },
  };
};

export const updateUserImage = async (userId: string, url: string) => {
  try {
    await db.user.update({
      where: {
        id: userId,
      },
      data: {
        image: url,
      },
    });
    revalidatePath("/user/[userId]", "page");
    return {
      message: "Profile image updated successfully",
    };
  } catch (error) {
    return {
      error: "Failed to update image",
    };
  }
};

export const updateUser = async (userId: string, data: any) => {
  const validatedData = UpdateProfileSchema.safeParse(data);

  if (!validatedData.success) {
    const errors = validatedData.error.flatten().fieldErrors;
    const firstError = Object.values(errors)[0][0] || "Invalid input";
    return {
      error: firstError,
    };
  }

  try {
    await db.user.update({
      where: {
        id: userId,
      },
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        name: `${data.firstName} ${data.lastName}`,
        // phone: data.phone,
        university: data.university,
        dateOfBirth: data.dateOfBirth,
        stateName: data.state,
      },
    });
    revalidatePath("/user/[userId]", "page");
    return {
      message: "Profile updated successfully",
    };
  } catch (error) {
    return {
      error: "Failed to update profile",
    };
  }
};

export const verifyUserEmailByAdmin = async (userId: string) => {
  const session = await auth();

  if (!session) {
    return {
      error: "User not authenticated",
    };
  }

  if (session.user.role !== UserRole.ADMIN) {
    return {
      error: "User not authorized",
    };
  }

  try {
    await db.user.update({
      where: {
        id: userId,
      },
      data: {
        emailVerified: new Date(),
      },
    });
    revalidatePath("/admin/users", "page");
    return {
      message: "Email verified successfully",
    };
  } catch (error) {
    return {
      error: "Failed to verify email",
    };
  }
};

export const changeUserRole = async (userId: string, role: UserRole) => {
  const session = await auth();

  if (!session) {
    return {
      error: "User not authenticated",
    };
  }

  if (session.user.role !== UserRole.ADMIN) {
    return {
      error: "User not authorized",
    };
  }

  try {
    await db.user.update({
      where: {
        id: userId,
      },
      data: {
        role,
      },
    });
    revalidatePath("/admin/users", "page");
    return {
      message: "Role updated successfully",
    };
  } catch (error) {
    return {
      error: "Failed to update role",
    };
  }
};

export const deleteUser = async (userId: string) => {
  const session = await auth();

  if (!session) {
    return {
      error: "User not authenticated",
    };
  }

  if (session.user.role !== UserRole.ADMIN) {
    return {
      error: "User not authorized",
    };
  }

  try {
    await db.user.delete({
      where: {
        id: userId,
      },
    });
    revalidatePath("/admin/users", "page");
    return {
      message: "User deleted successfully",
    };
  } catch (error) {
    console.error(error);
    return {
      error: "Failed to delete user",
    };
  }
};

export const getUserDataForEvent = async (eventId: string, userId: string) => {
  const isLikedByUser = await getIsLikedByUser(eventId, userId);
  const isUserAttending = await isUserAttendingEvent(eventId, userId);
  const isUserNotAttending = await isUserNotAttendingEvent(eventId, userId);

  return {
    isLikedByUser,
    isUserAttending,
    isUserNotAttending,
  };
};

export const fetchLeaderboard = async (page?: number, limit?: number) => {
  const users = await getAllUsersWithPointsPaginated(page, limit);
  return users;
};
