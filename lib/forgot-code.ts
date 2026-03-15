import { getForgotPasswordCodeByEmail } from "@/data/forgot-password";
import crypto from "crypto";
import { db } from "./db";

export const generateForgotPasswordCode = async (email: string) => {
  // 8-char hex = 4,294,967,296 possible values (vs 900,000 for 6-digit)
  const code = crypto.randomBytes(4).toString("hex").toUpperCase();
  const expires = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes

  const existingForgotPasswordCode = await getForgotPasswordCodeByEmail(email);

  if (existingForgotPasswordCode) {
    await db.forgotPasswordCode.delete({
      where: { id: existingForgotPasswordCode.id },
    });
  }

  const forgotPasswordCode = await db.forgotPasswordCode.create({
    data: { email, code, expires },
  });

  return forgotPasswordCode;
};
