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
          isVerifiedOrg: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
    skip,
    take: limit,
  });

  // Batch-load reply targets
  const replyIds = messages
    .map((m) => m.replyToId)
    .filter((id): id is string => !!id);

  let replyMap: Record<string, { id: string; message: string; user: { id: string; name: string } }> = {};
  if (replyIds.length > 0) {
    const uniqueIds = Array.from(new Set(replyIds));
    const replyMessages = await db.message.findMany({
      where: { id: { in: uniqueIds } },
      select: {
        id: true,
        message: true,
        user: { select: { id: true, name: true } },
      },
    });
    for (const rm of replyMessages) {
      replyMap[rm.id] = rm;
    }
  }

  const enriched = messages.map((m) => ({
    ...m,
    replyTo: m.replyToId ? replyMap[m.replyToId] || null : null,
  }));

  return enriched;
}
