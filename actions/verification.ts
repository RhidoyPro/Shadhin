"use server";

import { auth } from "@/auth";
import { getUserByEmail } from "@/data/user";
import { getVerificationTokenByToken } from "@/data/verification-token";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/mail";
import { UserRole } from "@prisma/client";

export const newVerification = async (token: string) => {
  const existingToken = await getVerificationTokenByToken(token);

  if (!existingToken) {
    return {
      error: "Invalid token, please try again",
    };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return {
      error:
        "Token has expired, please try to login again to generate a new token",
    };
  }

  const existingUser = await getUserByEmail(existingToken.email);

  if (!existingUser) {
    return {
      error: "Email not found, please try again",
    };
  }

  await db.user.update({
    where: {
      id: existingUser.id,
    },
    data: {
      emailVerified: new Date(),
    },
  });

  await db.verificationToken.delete({
    where: {
      id: existingToken.id,
    },
  });

  return {
    message: "Email verified successfully",
  };
};

export const sendReVerificationEmailsByAdmin = async () => {
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
    const pendingVerifications = await db.verificationToken.findMany();

    if (pendingVerifications.length === 0) {
      return {
        message: "No pending verifications",
      };
    }

    for (const verification of pendingVerifications) {
      await sendVerificationEmail(verification.email, verification.token);
    }

    return {
      message: "Re-verification emails sent successfully",
    };
  } catch {
    return {
      error: "Failed to send re-verification emails",
    };
  }
};
