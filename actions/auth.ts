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
import { sendVerificationEmail } from "@/lib/mail";

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
    return {
      error: "User does not exist",
    };
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
    const verificationToken = await generateVerificationToken(
      rawFormData.email || existingUser.email
    );

    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    );

    return {
      message:
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
    //check if user already exists
    const user = await getUserByEmail(rawFormData.email);

    if (user) {
      return {
        error: "User already exists with this email",
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

    return {
      message: "Verification email sent! Please verify your email and login",
    };
  } catch (error: any) {
    return {
      error: error.message || "Something went wrong while signing up",
    };
  }
};
