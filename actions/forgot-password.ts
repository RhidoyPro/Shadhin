"use server";
import { getForgotPasswordCodeByCode } from "@/data/forgot-password";
import { getUserByEmail } from "@/data/user";
import { db } from "@/lib/db";
import { generateForgotPasswordCode } from "@/lib/forgot-code";
import { sendForgotPasswordEmail } from "@/lib/mail";
import { saltAndHash } from "@/utils/helper";
import { ResetEmailSchema, ResetPasswordSchema } from "@/utils/zodSchema";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export const sendForgotPasswordCode = async (email: string) => {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const result = await rateLimit(`forgot-password:${ip}`, {
    limit: 5,
    windowSeconds: 300,
  });
  if (result.limited) {
    return {
      error: `Too many requests. Please try again in ${result.retryAfterSeconds} seconds.`,
    };
  }

  const validatedData = ResetEmailSchema.safeParse({ email });

  if (!validatedData.success) {
    return {
      error: validatedData.error.issues[0].message || "Invalid email",
    };
  }

  const existingUser = await getUserByEmail(email);

  // Don't reveal whether the email exists — always return the same message
  if (!existingUser) {
    return { message: "If that email is registered, a reset code has been sent" };
  }

  const forgotPasswordCode = await generateForgotPasswordCode(email);
  await sendForgotPasswordEmail(email, forgotPasswordCode.code);

  return { message: "If that email is registered, a reset code has been sent" };
};

export const forgotPassword = async (
  code: string,
  password: string,
  setPassword: boolean = false
) => {
  // Rate limit by IP — not by code — so spreading guesses across codes doesn't bypass this
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const limited = await rateLimit(`verify-code:${ip}`, {
    limit: 10,
    windowSeconds: 300,
  });
  if (limited.limited) {
    return {
      error: `Too many attempts. Please try again in ${limited.retryAfterSeconds} seconds.`,
    };
  }

  // Validate code format before hitting DB (8-char hex)
  if (!code || !/^[0-9A-F]{8}$/.test(code.trim().toUpperCase())) {
    return { error: "Invalid code, please try again" };
  }

  const existingCode = await getForgotPasswordCodeByCode(
    code.trim().toUpperCase()
  );

  if (!existingCode) {
    return { error: "Invalid code, please try again" };
  }

  const hasExpired = new Date(existingCode.expires) < new Date();

  if (hasExpired) {
    await db.forgotPasswordCode.delete({ where: { id: existingCode.id } });
    return { error: "Code has expired, please try again" };
  }

  const existingUser = await getUserByEmail(existingCode.email);

  if (!existingUser) {
    return { error: "Invalid code, please try again" };
  }

  if (!setPassword) {
    return { showSetPassword: true };
  }

  const validatedData = ResetPasswordSchema.safeParse({ password });

  if (!validatedData.success) {
    return { error: validatedData.error.issues[0].message };
  }

  const newPassword = saltAndHash(password);

  await db.user.update({
    where: { id: existingUser.id },
    data: { hashedPassword: newPassword },
  });

  await db.forgotPasswordCode.delete({ where: { id: existingCode.id } });

  return {
    message: "Password reset successful, you can now login",
    resetSuccess: true,
  };
};
