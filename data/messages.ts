import { db } from "@/lib/db";
import { getCached, setCache } from "@/lib/cache";

// Messages cached for 2 minutes — invalidated on new message
const MESSAGES_TTL = 120;

export const getMessagesByStateName = async (
  stateName: string,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;
  const cacheKey = `messages:${stateName}:${page}:${limit}`;

  try {
    // Try cache first
    const cached = await getCached<Awaited<ReturnType<typeof fetchFromDb>>>(cacheKey);
    if (cached) return cached;

    const messages = await fetchFromDb(stateName, skip, limit);
    if (messages) {
      setCache(cacheKey, messages, MESSAGES_TTL).catch(() => {});
    }
    return messages;
  } catch {
    return null;
  }
};

async function fetchFromDb(stateName: string, skip: number, limit: number) {
  const messages = await db.message.findMany({
    where: { stateName },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  // Sort ascending for display (fetched desc for pagination)
  messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return messages;
}
