"use server";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/auth";
import { getUserByEmail, getUserByPhone } from "@/data/user";
import { db } from "@/lib/db";
import { generateVerificationToken } from "@/lib/tokens";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { saltAndHash } from "@/utils/helper";
import { SignupSchema } from "@/utils/zodSchema";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { sendVerificationEmail, sendWelcomeEmail, sendNewDistrictMemberEmail } from "@/lib/mail";
import {
  getVerificationTokenByEmail,
  updateIsEmailSent,
} from "@/data/verification-token";
import { rateLimit } from "@/lib/rate-limit";
import { validatePasswordNotBreached } from "@/lib/password-check";
import { headers } from "next/headers";

export const login = async (provider: string) => {
  await signIn(provider, {
    redirectTo: DEFAULT_LOGIN_REDIRECT,
  });
  revalidatePath("/");
};

export const logout = async () => {
  await signOut();
  revalidatePath("/");
};

interface ILoginData {
  email: string;
  password: string;
  loginWithPhone: boolean;
  phone: string;
}

export const loginWithCreds = async (state: any, formData: ILoginData) => {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const rateLimitKey = `login:${ip}`;
  const result = await rateLimit(rateLimitKey, { limit: 10, windowSeconds: 60 });
  if (result.limited) {
    return {
      error: `Too many login attempts. Please try again in ${result.retryAfterSeconds} seconds.`,
    };
  }

  const rawFormData = {
    email: formData.email,
    password: formData.password,
    loginWithPhone: formData.loginWithPhone,
    phone: formData.phone,
    redirectTo: DEFAULT_LOGIN_REDIRECT,
  };

  let existingUser;

  if (rawFormData.loginWithPhone) {
    existingUser = await getUserByPhone(rawFormData.phone);
  } else {
    existingUser = await getUserByEmail(rawFormData.email);
  }

  if (!existingUser || !existingUser.email || !existingUser.hashedPassword) {
    // Don't reveal whether the account exists — same message for both cases
    return { error: "Invalid credentials" };
  }

  const isMatch = bcrypt.compareSync(
    rawFormData.password,
    existingUser.hashedPassword
  );

  if (!isMatch) {
    return {
      error: "Invalid credentials",
    };
  }

  if (!existingUser.emailVerified) {
    const existingToken = await getVerificationTokenByEmail(existingUser.email);

    if (!existingToken || new Date(existingToken.expires) < new Date()) {
      const verificationToken = await generateVerificationToken(
        existingUser.email
      );
      await sendVerificationEmail(
        verificationToken.email,
        verificationToken.token
      );
      await updateIsEmailSent(verificationToken.token);
    } else {
      await sendVerificationEmail(existingToken.email, existingToken.token);
      await updateIsEmailSent(existingToken.token);
    }

    return {
      error:
        "Your email is not verified. Verification email send again, please verify your email and login",
    };
  }
  try {
    await signIn("credentials", {
      ...rawFormData,
      email: rawFormData.email || existingUser.email,
    });
  } catch (error: any) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin": {
          return {
            error: "Invalid credentials",
          };
        }

        default: {
          return {
            error: "Something went wrong while logging in",
          };
        }
      }
    }

    throw error;
  }

  revalidatePath("/");
  return {
    message: "Login successful",
  };
};

interface ISignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  university: string;
  dateOfBirth: Date | undefined;
  state: string;
}

export const signup = async (state: any, formData: ISignupData) => {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const result = await rateLimit(`signup:${ip}`, { limit: 5, windowSeconds: 300 });
  if (result.limited) {
    return {
      error: `Too many signup attempts. Please try again in ${result.retryAfterSeconds} seconds.`,
    };
  }

  const rawFormData = {
    email: formData.email,
    password: formData.password,
    firstName: formData.firstName,
    lastName: formData.lastName,
    phone: formData.phone,
    university: formData.university,
    dateOfBirth: formData.dateOfBirth,
    state: formData.state,
  };

  const validatedData = SignupSchema.safeParse(rawFormData);

  if (!validatedData.success) {
    const errors = validatedData.error.flatten().fieldErrors;
    const firstError = Object.values(errors)[0][0] || "Invalid input";
    return {
      error: firstError,
    };
  }

  try {
    // Check breached passwords
    const breachError = await validatePasswordNotBreached(rawFormData.password);
    if (breachError) return { error: breachError };

    //check if user already exists
    const user = await getUserByEmail(rawFormData.email);

    if (user) {
      // Don't confirm email existence — silently redirect as if success
      return {
        message: "Verification email sent! Please verify your email and login",
      };
    }

    const hashedPassword = saltAndHash(rawFormData.password);

    await db.user.create({
      data: {
        email: rawFormData.email,
        hashedPassword: hashedPassword,
        name: `${rawFormData.firstName} ${rawFormData.lastName}`,
        firstName: rawFormData.firstName,
        lastName: rawFormData.lastName,
        phone: rawFormData.phone,
        university: rawFormData.university,
        dateOfBirth: rawFormData.dateOfBirth,
        stateName: rawFormData.state,
      },
    });

    const verificationToken = await generateVerificationToken(
      rawFormData.email
    );

    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    );

    //we need to update isEmailSent to true
    await updateIsEmailSent(verificationToken.token);

    // Send welcome email (non-blocking)
    sendWelcomeEmail(
      rawFormData.email,
      rawFormData.firstName,
      rawFormData.state
    ).catch(() => {});

    // Notify up to 10 recent users in the same district (non-blocking)
    db.user.findMany({
      where: {
        stateName: rawFormData.state,
        emailVerified: { not: null },
        email: { not: rawFormData.email },
      },
      select: { email: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }).then((users) => {
      const fullName = `${rawFormData.firstName} ${rawFormData.lastName}`;
      for (const u of users) {
        if (u.email) {
          sendNewDistrictMemberEmail(u.email, fullName, rawFormData.state).catch(() => {});
        }
      }
    }).catch(() => {});

    return {
      message: "Verification email sent! Please verify your email and login",
    };
  } catch (error: any) {
    return {
      error: error.message || "Something went wrong while signing up",
    };
  }
};
