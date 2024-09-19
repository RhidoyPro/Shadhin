import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./lib/db";
import { getUserByEmail, getUserById } from "./data/user";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      role: UserRole;
    } & DefaultSession["user"];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
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

        const isMatch = bcrypt.compareSync(
          credentials.password as string,
          user.hashedPassword
        );

        if (!isMatch) {
          return null;
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

      return session;
    },
    async jwt({ token, trigger, session }) {
      if (!token.email) return token;

      const existingUser = await getUserByEmail(token.email);

      if (!existingUser) return token;

      token.role = existingUser.role;
      token.userId = existingUser.id;
      if (trigger === "update") {
        return {
          ...token,
          ...session.user,
        };
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
