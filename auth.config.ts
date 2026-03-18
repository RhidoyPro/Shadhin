import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  callbacks: {
    session({ session, token }) {
      if (token?.userId && session.user) {
        session.user.id = token.userId as string;
      }
      if (token.role) {
        session.user.role = token.role;
      }
      session.user.isSuspended = (token.isSuspended as boolean) ?? false;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
