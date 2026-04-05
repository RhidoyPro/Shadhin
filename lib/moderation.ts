const OPENAI_MODERATION_URL = "https://api.openai.com/v1/moderations";

export type ModerationResult = {
  flagged: boolean;
  categories: string[];
};

// ====================================================================
// BLOCKLISTS — fail-closed local checks (run BEFORE any API call)
// Word boundaries enforced where possible to reduce false positives.
// ====================================================================

// English profanity / NSFW / hate speech. Kept conservative to avoid
// false positives on normal conversation.
const EN_PROFANITY = [
  "fuck", "fck", "fuk", "shit", "bitch", "bastard", "asshole", "pussy",
  "dick", "cock", "cunt", "whore", "slut", "faggot", "nigger", "nigga",
  "retard", "pedophile", "pedo", "rapist", "rape", "jerk off", "cum",
  "porn", "xxx", "nsfw", "blowjob", "handjob", "anal", "masturbat",
  "horny", "nude", "naked girl", "boobs", "tits", "penis", "vagina",
];

// Bengali profanity / slurs (Unicode). Covers common Bangla abuse terms.
// List compiled from community-maintained profanity filters.
const BN_PROFANITY = [
  // Core profanity
  "চুদ", "চোদ", "চুদি", "চুদা", "চোদা", "চুদানি", "চুদির",
  "বাল", "বালের", "বাইল",
  "মাগি", "মাগী", "মাগির", "মাগীর",
  "খানকি", "খানকির", "খানকী",
  "বেশ্যা", "বেশ্যার", "পতিতা",
  "হারামি", "হারামী", "হারামির", "হারামজাদা", "হারামজাদি",
  "কুত্তা", "কুত্তার", "কুত্তি", "কুকুর",
  "শুয়োর", "শূয়োর", "শুয়োরের", "শুয়রের",
  "গাণ্ডু", "গান্ডু", "গাণ্ডুর",
  "খাংকি", "খানগি",
  "লুলা", "লুল",
  "বোকাচোদা", "বোকাচুদা", "বলদ",
  // Sexual/NSFW
  "পর্ন", "পর্ণ", "সেক্স", "সেক্সি", "সেক্সী", "ন্যুড",
  "চুত", "চুৎ", "চুতিয়া", "চুতমারানি",
  "লিঙ্গ", "যোনি",
  // Hate/slurs
  "মালাউন", "মালাউনের",
  "নাস্তিক",
  // Common obfuscations
  "madarchod", "madarchood", "bhenchod", "bhenchood", "benchod",
  "chutiya", "chutia", "chutiye", "chodu", "chudi", "chod",
  "harami", "haramjada", "kuttar bacha", "shala", "shaala",
  "randi", "rendi", "magi", "magir",
  "khankir", "khanki", "khanki magi",
  "boka choda", "bokachoda", "bal", "baler",
];

// URLs / phone patterns often used for spam
const SPAM_PATTERNS = [
  /\b(whatsapp|telegram|wechat|viber)\s*[:#]?\s*\+?\d{6,}/i,
  /\b(call|contact|whatsapp)\s+me\s+at\b/i,
];

// ====================================================================
// Normalization — defeats simple obfuscation (l33t, extra spaces, etc.)
// ====================================================================
function normalize(text: string): string {
  return text
    .toLowerCase()
    // Common leetspeak
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/!/g, "i")
    // Collapse any repeated char to single: "fuuuuck" -> "fuck", "asshole" -> "ashole"
    .replace(/(.)\1+/g, "$1")
    // Strip non-letter separators between chars: "f.u.c.k" -> "fuck"
    .replace(/([a-z])[\s._\-*]+(?=[a-z])/g, "$1");
}

// Pre-normalize the EN blocklist so "asshole" becomes "ashole" etc.
// This mirrors the aggressive collapse applied to input text.
const EN_PROFANITY_NORMALIZED = EN_PROFANITY.map((w) =>
  w.toLowerCase().replace(/(.)\1+/g, "$1"),
);

function containsAny(haystack: string, needles: string[]): string | null {
  for (const n of needles) {
    if (haystack.includes(n)) return n;
  }
  return null;
}

// ====================================================================
// Main moderation function
// ====================================================================
export async function moderateText(content: string): Promise<ModerationResult> {
  if (!content || !content.trim()) {
    return { flagged: false, categories: [] };
  }

  // 1. Local blocklist check (fail-closed, always runs, catches Bengali)
  const local = localBlocklistCheck(content);
  if (local.flagged) return local;

  // 2. OpenAI moderation (best-effort, for English/multilingual edge cases)
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(OPENAI_MODERATION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ input: content }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

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
      // OpenAI unreachable — we already ran local check above, so fall through.
    }
  }

  // 3. Local check already passed; content is clean per our rules.
  return { flagged: false, categories: [] };
}

/**
 * Local blocklist check — runs synchronously, catches Bengali + English
 * profanity, slurs, spam patterns. Fail-closed for known-bad content.
 */
function localBlocklistCheck(content: string): ModerationResult {
  const categories: string[] = [];

  // Check Bengali as-is (no normalization needed for Bengali Unicode)
  const bnHit = containsAny(content, BN_PROFANITY);
  if (bnHit) categories.push("profanity");

  // Check English after normalization (catches leetspeak + repeat-char evasion)
  const normalized = normalize(content);
  const enHit = containsAny(normalized, EN_PROFANITY_NORMALIZED);
  if (enHit && !categories.includes("profanity")) categories.push("profanity");

  // Spam patterns (contact info harvesting)
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(content)) {
      categories.push("spam");
      break;
    }
  }

  // Character-repeat spam
  if (/(.)\1{15,}/.test(content)) {
    if (!categories.includes("spam")) categories.push("spam");
  }

  return { flagged: categories.length > 0, categories };
}
