"use server";

import { auth } from "@/auth";
import { searchUsersAndEvents } from "@/data/user";

export const search = async (query: string) => {
  const session = await auth();

  if (!session) {
    return { error: "User not authenticated" };
  }

  if (!query || query.trim().length < 2) {
    return { users: [], events: [] };
  }

  return await searchUsersAndEvents(query);
};
