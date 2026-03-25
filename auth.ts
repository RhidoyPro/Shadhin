import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./lib/db";
import { getUserByEmail, getUserById } from "./data/user";
import { UserRole } from "@prisma/client";
import { authConfig } from "./auth.config";

declare module "next-auth" {
  interface Session {
    user: {
      role: UserRole;
      isSuspended: boolean;
      isVerifiedOrg: boolean;
      createdAt?: string;
      stateName?: string;
    } & DefaultSession["user"];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "email@example.com",
        },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials || !credentials.email || !credentials.password) {
          return null;
        }

        const email = credentials.email as string;

        const user = await getUserByEmail(email);

        if (!user || !user.hashedPassword) {
          return null;
        }

        // Account lockout check
        if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
          return null;
        }

        const isMatch = bcrypt.compareSync(
          credentials.password as string,
          user.hashedPassword
        );

        if (!isMatch) {
          const attempts = (user.failedLoginAttempts ?? 0) + 1;
          const updateData: { failedLoginAttempts: number; lockedUntil?: Date } = {
            failedLoginAttempts: attempts,
          };
          if (attempts >= 5) {
            updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
          }
          await db.user.update({ where: { id: user.id }, data: updateData }).catch(() => {});
          return null;
        }

        // Reset failed attempts on successful login
        if (user.failedLoginAttempts && user.failedLoginAttempts > 0) {
          await db.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
          }).catch(() => {});
        }

        return {
          name: user?.name || user.firstName,
          email: user.email,
          image: user?.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ account, user }) {
      //allow OAuth without email verification
      if (account?.provider !== "credentials") return true;

      if (user.email) {
        const existingUser = await getUserByEmail(user.email);
        // prevent login if email is not verified
        if (!existingUser?.emailVerified) {
          return false;
        }
      }

      return true;
    },
    async session({ session, token }) {
      if (token?.userId && session.user) {
        session.user.id = token.userId;
      }

      if (token.role) {
        session.user.role = token.role;
      }

      session.user.isSuspended = token.isSuspended ?? false;
      session.user.isVerifiedOrg = token.isVerifiedOrg ?? false;
      session.user.createdAt = token.createdAt;
      session.user.stateName = token.stateName;

      return session;
    },
    async jwt({ token, trigger, session, user }) {
      // Only query DB on initial sign-in (when user object is present) or
      // explicit session update — NOT on every single auth() call.
      if (trigger === "update") {
        // Manual session update (e.g., after profile edit)
        return { ...token, ...session.user };
      }

      // On sign-in: populate token from DB (runs once)
      if (user && token.email) {
        const existingUser = await getUserByEmail(token.email);
        if (existingUser) {
          token.role = existingUser.role;
          token.userId = existingUser.id;
          token.isSuspended = existingUser.isSuspended;
          token.isVerifiedOrg = existingUser.isVerifiedOrg;
          token.createdAt = existingUser.createdAt?.toISOString();
          token.stateName = existingUser.stateName ?? undefined;
        }
      }

      return token;
    },
  },
  events: {
    linkAccount: async ({ user }) => {
      await db.user.update({
        where: {
          id: user.id,
        },
        data: {
          emailVerified: new Date(),
        },
      });
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
});
