import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "./s3";
import crypto from "crypto";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const R2_BUCKET = process.env.R2_BUCKET_NAME || process.env.AWS_BUCKET_NAME || "shadhin";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://pub-81b012e4d7214ac491438e1df8c5bf00.r2.dev";

/**
 * Use Gemini to extract 2-3 English search keywords from a Bengali headline.
 */
async function extractKeywords(headline: string): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) return "Bangladesh news";

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Extract 2-3 English keywords for image search from this headline. Return ONLY the keywords separated by spaces, nothing else.\nHeadline: "${headline}"` }] }],
          generationConfig: { maxOutputTokens: 20, temperature: 0.1 },
        }),
        signal: AbortSignal.timeout(5000),
      }
    );
    const data = await res.json();
    const keywords = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return keywords || "Bangladesh community";
  } catch {
    return "Bangladesh community";
  }
}

/**
 * Fetch a relevant image from Pexels, download it, upload to R2, return public URL.
 * Returns null if anything fails (posts without images are fine).
 */
export async function fetchAndUploadImage(headline: string): Promise<string | null> {
  if (!PEXELS_API_KEY) {
    console.error("[bot-image] PEXELS_API_KEY missing from env");
    return null;
  }

  try {
    const query = await extractKeywords(headline);

    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape&size=medium`,
      {
        headers: { Authorization: PEXELS_API_KEY },
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!res.ok) {
      console.error(`[bot-image] Pexels search failed: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    if (!data.photos?.length) {
      console.error(`[bot-image] Pexels returned 0 photos for query="${query}"`);
      return null;
    }

    // Pick random photo from results for variety
    const photo = data.photos[Math.floor(Math.random() * data.photos.length)];
    const imageUrl: string = photo.src.large; // 940px wide

    // Download the image
    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
    if (!imgRes.ok) {
      console.error(`[bot-image] Image download failed: ${imgRes.status} ${imageUrl}`);
      return null;
    }
    const buffer = Buffer.from(await imgRes.arrayBuffer());

    // Upload to R2
    const key = `bot-images/${crypto.randomBytes(16).toString("hex")}.jpg`;
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: "image/jpeg",
        })
      );
    } catch (uploadErr) {
      console.error(`[bot-image] R2 upload failed: ${(uploadErr as Error).message}`);
      return null;
    }

    return `${R2_PUBLIC_URL}/${key}`;
  } catch (err) {
    console.error(`[bot-image] Unexpected error: ${(err as Error).message}`);
    return null;
  }
}
