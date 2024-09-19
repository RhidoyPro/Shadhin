"use server";
import { getForgotPasswordCodeByCode } from "@/data/forgot-password";
import { getUserByEmail } from "@/data/user";
import { db } from "@/lib/db";
import { generateForgotPasswordCode } from "@/lib/forgot-code";
import { sendForgotPasswordEmail } from "@/lib/mail";
import { saltAndHash } from "@/utils/helper";
import { ResetEmailSchema, ResetPasswordSchema } from "@/utils/zodSchema";

export const sendForgotPasswordCode = async (email: string) => {
  const validatedData = ResetEmailSchema.safeParse({ email });

  if (!validatedData.success) {
    return {
      error: validatedData.error.errors[0].message || "Invalid email",
    };
  }

  const existingUser = await getUserByEmail(email);

  if (!existingUser) {
    return {
      error: "User does not exist",
    };
  }

  const forgotPasswordCode = await generateForgotPasswordCode(email);
  await sendForgotPasswordEmail(email, forgotPasswordCode.code);

  return {
    message: "Reset code sent to your email",
  };
};

export const forgotPassword = async (
  code: string,
  password: string,
  setPassword: boolean = false
) => {
  console.log(code);
  const existingCode = await getForgotPasswordCodeByCode(code);
  console.log(existingCode);

  if (!existingCode) {
    return {
      error: "Invalid code, please try again",
    };
  }

  const hasExpired = new Date(existingCode.expires) < new Date();

  if (hasExpired) {
    return {
      error: "Code has expired, please try again",
    };
  }

  const existingUser = await getUserByEmail(existingCode.email);

  if (!existingUser) {
    return {
      error: "Email not found, please try again",
    };
  }

  if (!setPassword) {
    return {
      showSetPassword: true,
    };
  }

  const validatedData = ResetPasswordSchema.safeParse({ password });

  if (!validatedData.success) {
    return {
      error: validatedData.error.errors[0].message,
    };
  }

  const newPassword = saltAndHash(password);

  await db.user.update({
    where: {
      id: existingUser.id,
    },
    data: {
      hashedPassword: newPassword,
    },
  });

  await db.forgotPasswordCode.delete({
    where: {
      id: existingCode.id,
    },
  });

  return {
    message: "Password reset successful, you can now login",
    resetSuccess: true,
  };
};
