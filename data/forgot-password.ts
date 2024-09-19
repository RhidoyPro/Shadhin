import { db } from "@/lib/db";

export const getForgotPasswordCodeByCode = async (code: string) => {
  try {
    const forgotPasswordCode = await db.forgotPasswordCode.findUnique({
      where: {
        code,
      },
    });

    return forgotPasswordCode;
  } catch {
    return null;
  }
};

export const getForgotPasswordCodeByEmail = async (email: string) => {
  try {
    const forgotPasswordCode = await db.forgotPasswordCode.findFirst({
      where: {
        email,
      },
    });

    return forgotPasswordCode;
  } catch {
    return null;
  }
};
