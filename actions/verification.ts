"use server";

import { auth } from "@/auth";
import { getUserByEmail } from "@/data/user";
import {
  getVerificationTokenByToken,
  updateIsEmailSent,
} from "@/data/verification-token";
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

    const filteredPendingVerifications = pendingVerifications.filter(
      (verification) => !verification.isEmailSent
    );

    if (filteredPendingVerifications.length === 0) {
      return {
        message: "No pending verifications",
      };
    }

    let count = 0;

    for (const verification of filteredPendingVerifications) {
      if (count > 15) {
        //wait for 1s before sending the next email
        await new Promise((resolve) => setTimeout(resolve, 1000));
        count = 0;
      }
      await sendVerificationEmail(verification.email, verification.token);
      await updateIsEmailSent(verification.token);
      count++;
    }

    return {
      message: "Re-verification emails sent successfully",
    };
  } catch (e: any) {
    console.error(e);
    return {
      error: "Failed to send re-verification emails",
    };
  }
};
