"use server";

import { auth } from "@/auth";
import {
  isUserAttendingEvent,
  isUserNotAttendingEvent,
} from "@/data/event-attend";
import { getIsLikedByUser } from "@/data/like";
import { getAllUsersWithPointsPaginated } from "@/data/user";
import { db } from "@/lib/db";
import { isAdminLevel, canAssignRole } from "@/lib/roles";
import { UpdateProfileSchema } from "@/utils/zodSchema";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { UserRole } from "@prisma/client";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { s3 } from "@/lib/s3";
import { moderateText } from "@/lib/moderation";

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
      publicUrl: `${process.env.R2_PUBLIC_URL}/${Key}`,
    },
  };
};

export const updateUserImage = async (userId: string, url: string) => {
  const session = await auth();

  if (!session) {
    return { error: "User not authenticated" };
  }

  if (session.user.id !== userId) {
    return { error: "Unauthorized" };
  }

  try {
    await db.user.update({
      where: { id: userId },
      data: { image: url },
    });
    revalidatePath("/user/[userId]", "page");
    return { message: "Profile image updated successfully" };
  } catch {
    return { error: "Failed to update image" };
  }
};

export const updateUser = async (userId: string, data: any) => {
  const session = await auth();

  if (!session) {
    return { error: "User not authenticated" };
  }

  if (session.user.id !== userId) {
    return { error: "Unauthorized" };
  }

  const validatedData = UpdateProfileSchema.safeParse(data);

  if (!validatedData.success) {
    const errors = validatedData.error.flatten().fieldErrors;
    const firstError = Object.values(errors)[0][0] || "Invalid input";
    return { error: firstError };
  }

  try {
    const v = validatedData.data;

    // Moderate user-visible text fields
    const checks = [
      v.bio,
      v.firstName,
      v.lastName,
      v.university,
    ].filter((t): t is string => typeof t === "string" && t.trim().length > 0);
    for (const text of checks) {
      const mod = await moderateText(text);
      if (mod.flagged) {
        return { error: "Profile contains inappropriate content. Please revise." };
      }
    }

    await db.user.update({
      where: { id: userId },
      data: {
        email: v.email,
        firstName: v.firstName,
        lastName: v.lastName,
        name: `${v.firstName} ${v.lastName}`,
        university: v.university,
        dateOfBirth: v.dateOfBirth,
        stateName: v.state,
        bio: v.bio,
      },
    });
    revalidatePath("/user/[userId]", "page");
    return { message: "Profile updated successfully" };
  } catch {
    return { error: "Failed to update profile" };
  }
};

export const verifyUserEmailByAdmin = async (userId: string) => {
  const session = await auth();

  if (!session) {
    return {
      error: "User not authenticated",
    };
  }

  if (!isAdminLevel(session.user.role)) {
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

  if (!canAssignRole(session.user.role, role)) {
    return {
      error: "User not authorized to assign this role",
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

  if (!isAdminLevel(session.user.role)) {
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
  const [isLikedByUser, isUserAttending, isUserNotAttending] = await Promise.all([
    getIsLikedByUser(eventId, userId),
    isUserAttendingEvent(eventId, userId),
    isUserNotAttendingEvent(eventId, userId),
  ]);

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
