"use server";

import { auth } from "@/auth";
import { searchUsersAndEvents } from "@/data/user";
import { rateLimit } from "@/lib/rate-limit";

export const search = async (query: string) => {
  const session = await auth();

  if (!session) {
    return { error: "User not authenticated" };
  }

  const limited = rateLimit(`search:${session.user.id}`, {
    limit: 20,
    windowSeconds: 60,
  });
  if (limited.limited) {
    return { error: "Too many searches. Please slow down." };
  }

  if (!query || query.trim().length < 2) {
    return { users: [], events: [] };
  }

  // Cap query length to prevent abuse
  const trimmed = query.trim().slice(0, 100);

  return await searchUsersAndEvents(trimmed);
};
