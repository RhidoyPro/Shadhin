import { getForgotPasswordCodeByEmail } from "@/data/forgot-password";
import crypto from "crypto";
import { db } from "./db";

export const generateForgotPasswordCode = async (email: string) => {
  const code = crypto.randomInt(100_000, 1_000_000).toString();
  const expires = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes

  const existingForgotPasswordCode = await getForgotPasswordCodeByEmail(email);

  if (existingForgotPasswordCode) {
    await db.forgotPasswordCode.delete({
      where: {
        id: existingForgotPasswordCode.id,
      },
    });
  }

  const forgotPasswordCode = await db.forgotPasswordCode.create({
    data: {
      email,
      code,
      expires,
    },
  });

  return forgotPasswordCode;
};
