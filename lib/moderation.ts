const OPENAI_MODERATION_URL = "https://api.openai.com/v1/moderations";

export type ModerationResult = {
  flagged: boolean;
  categories: string[];
};

/**
 * Moderate text using OpenAI's free moderation endpoint.
 * This endpoint is free and doesn't require an API key with billing,
 * but does require a valid OpenAI API key.
 *
 * Falls back to basic keyword check if no API key is configured.
 */
export async function moderateText(content: string): Promise<ModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const res = await fetch(OPENAI_MODERATION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ input: content }),
      });

      if (res.ok) {
        const data = await res.json();
        const result = data.results?.[0];

        if (result?.flagged) {
          const flaggedCategories = Object.entries(result.categories)
            .filter(([, flagged]) => flagged)
            .map(([category]) => category);

          return { flagged: true, categories: flaggedCategories };
        }

        return { flagged: false, categories: [] };
      }
    } catch {
      // Fall through to basic check
    }
  }

  // Basic keyword fallback when OpenAI is unavailable
  return basicTextCheck(content);
}

/**
 * Basic keyword-based content check as fallback.
 * Catches obvious spam/abuse patterns.
 */
function basicTextCheck(content: string): ModerationResult {
  const lower = content.toLowerCase();

  // Check for repeated character spam (e.g., "aaaaaaaaaa")
  const spamPattern = /(.)\1{15,}/;
  if (spamPattern.test(lower)) {
    return { flagged: true, categories: ["spam"] };
  }

  return { flagged: false, categories: [] };
}
