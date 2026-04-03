import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createHmac, timingSafeEqual } from "crypto";
import { rateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";

let _resend: Resend | null = null;
const getResend = () => {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
};

type EmailCategory = "simple_question" | "complaint" | "legal_urgent" | "repeat_contact";

interface ClassifiedEmail {
  category: EmailCategory;
  confidence: number;
  sentiment: "positive" | "neutral" | "frustrated" | "angry";
  summary: string;
  language: "bn" | "en" | "mixed";
  autoReply: string | null;
  topics: string[];
}

interface PreFilterResult {
  skip: boolean;
  reason: string;
}

function preFilter(
  from: string,
  subject: string,
  body: string,
  headers: Record<string, string> | undefined
): PreFilterResult {
  // Auto-reply loop prevention: skip if Auto-Submitted header is present and not "no"
  if (headers) {
    const autoSubmitted = headers["Auto-Submitted"] || headers["auto-submitted"];
    if (autoSubmitted && autoSubmitted.toLowerCase() !== "no") {
      return { skip: true, reason: "spam_autoreply" };
    }
  }

  // Check from address for no-reply / system senders
  if (/no-?reply|donotreply|mailer-daemon|postmaster|bounce/i.test(from)) {
    return { skip: true, reason: "spam_noreply" };
  }

  // Check subject for out-of-office / auto-reply patterns
  if (/out of office|OOO|auto-?reply|automatic reply|on (vacation|leave|holiday)|unsubscribe/i.test(subject)) {
    return { skip: true, reason: "spam_ooo" };
  }

  // Also catch subjects starting with "Auto:" (loop prevention safety net)
  if (/^Auto:/i.test(subject) || /automatic reply/i.test(subject)) {
    return { skip: true, reason: "spam_autoreply" };
  }

  // Empty or garbled body
  if (body.length < 10) {
    return { skip: true, reason: "spam_empty" };
  }

  // Newsletter detection: body contains unsubscribe link pattern
  if (/unsubscribe/i.test(body) && /https?:\/\/\S*unsubscribe/i.test(body)) {
    return { skip: true, reason: "spam_newsletter" };
  }

  // Obvious spam content
  if (/viagra|crypto.?currency|lottery|won.*prize|wire.*transfer|nigerian/i.test(body)) {
    return { skip: true, reason: "spam_content" };
  }

  return { skip: false, reason: "" };
}

function keywordFallbackClassify(subject: string, body: string): ClassifiedEmail {
  const text = (subject + " " + body).toLowerCase();

  // Simple Bangla detection: check for Bengali Unicode range
  const hasBangla = /[\u0980-\u09FF]/.test(text);
  const language = hasBangla ? "bn" : "en";

  // Legal/urgent keywords
  if (/legal|lawyer|gdpr|data deletion|delete.*data|court|regulation|privacy act/i.test(text)) {
    return { category: "legal_urgent", confidence: 0.5, sentiment: "neutral", summary: "Keyword-matched: legal/urgent", language, autoReply: null, topics: ["legal"] };
  }

  // Complaint keywords
  if (/suspend|ban|unfair|bug|crash|broken|not working|frustrated|angry|worst|terrible/i.test(text)) {
    return { category: "complaint", confidence: 0.5, sentiment: "frustrated", summary: "Keyword-matched: complaint", language, autoReply: null, topics: ["complaint"] };
  }

  // Default: treat as complaint (safer than auto-replying with AI-less response)
  return { category: "complaint", confidence: 0.3, sentiment: "neutral", summary: "Budget exhausted — forwarded for human review", language, autoReply: null, topics: ["unclassified"] };
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

function verifyWebhookAuth(req: NextRequest): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return true;

  const authHeader = req.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;

  const key = Buffer.from(secret);
  const a = createHmac("sha256", key).update(authHeader).digest();
  const b = createHmac("sha256", key).update(expected).digest();

  return timingSafeEqual(a, b);
}

/**
 * Inbound email webhook from Resend
 * Receives emails to support@shadhin.io, classifies with Gemini 2.5 Flash (fallback: Claude Haiku),
 * auto-replies to simple questions in Bengali/English,
 * summarizes complaints, alerts admin for urgent ones
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const limited = await rateLimit(`webhook-email:${ip}`, { limit: 10, windowSeconds: 60 });
  if (limited.limited) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  if (!verifyWebhookAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Handle both Resend inbound and custom formats
    const payload = body.data || body;
    const { from, subject, text, html } = payload;

    if (!from || !text) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const senderEmail = typeof from === "string" ? from : from.address || from;
    const emailBody = (text || "").slice(0, 5000);
    const emailSubject = (subject || "(no subject)").replace(/[\r\n]/g, "").slice(0, 300);
    const emailHeaders = payload.headers as Record<string, string> | undefined;

    // Spam pre-filter: skip known junk before calling AI
    const filterResult = preFilter(senderEmail, emailSubject, emailBody, emailHeaders);
    if (filterResult.skip) {
      await persistEmail(senderEmail, emailSubject, emailBody, filterResult.reason, null, null);
      return NextResponse.json({ success: true, action: "filtered", reason: filterResult.reason });
    }

    // ── Repeat contact detection ──────────────────────────────────────────────
    const recentEmails = await db.supportEmail.count({
      where: {
        senderEmail,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    // Track whether this is a repeat contact (1 prior email) for subject tagging
    const isRepeatContact = recentEmails === 1;

    if (recentEmails >= 2) {
      // 3rd+ email in 7 days — skip AI, escalate immediately
      await persistEmail(
        senderEmail,
        emailSubject,
        emailBody,
        "repeat_contact",
        "Repeat contact (3rd+ email in 7 days) — needs human attention",
        null
      );
      await forwardToAdmin(
        senderEmail,
        emailSubject,
        "Repeat contact (3rd+ email in 7 days) — needs human attention\n\n---\n\n" + emailBody,
        "repeat_contact"
      );
      return NextResponse.json({ success: true, action: "escalated_repeat" });
    }

    // ── API budget guard (18 of 20 daily AI calls) ────────────────────────────
    const apiLimited = await rateLimit("gemini-daily-budget", { limit: 18, windowSeconds: 86400 });

    let classified: ClassifiedEmail | null;

    if (apiLimited.limited) {
      // Budget exhausted — use keyword fallback, no auto-reply
      classified = keywordFallbackClassify(emailSubject, emailBody);
      await persistEmail(
        senderEmail,
        emailSubject,
        emailBody,
        classified.category,
        classified.summary + " [keyword fallback — API budget exhausted]",
        classified.language,
        null,
        classified.confidence,
        classified.sentiment,
        classified.topics
      );

      // Forward all keyword-fallback emails to admin for human review (no auto-reply)
      const forwardSubject = isRepeatContact ? `[REPEAT CONTACT] ${emailSubject}` : emailSubject;
      await forwardToAdmin(senderEmail, forwardSubject, classified.summary + "\n\n---\n\n" + emailBody, classified.category === "legal_urgent" ? "urgent" : "complaint");
      return NextResponse.json({ success: true, action: "keyword_fallback" });
    }

    // Classify with AI (Gemini primary, Claude fallback)
    classified = await classifyEmail(emailSubject, emailBody);

    if (!classified) {
      await forwardToAdmin(senderEmail, emailSubject, emailBody, "classification_failed");
      await persistEmail(senderEmail, emailSubject, emailBody, "unclassified", null, null);
      return NextResponse.json({ success: true, action: "forwarded_fallback" });
    }

    // Persist to database (including confidence, sentiment, topics)
    await persistEmail(
      senderEmail,
      emailSubject,
      emailBody,
      classified.category,
      classified.summary,
      classified.language,
      classified.autoReply,
      classified.confidence,
      classified.sentiment,
      classified.topics
    );

    // Sentiment-based escalation: angry/frustrated users always get human attention
    if (classified.sentiment === "angry" || classified.sentiment === "frustrated") {
      console.log(`Sentiment escalation: ${classified.sentiment}, confidence=${classified.confidence}, category=${classified.category}`);
      const escalateSubject = isRepeatContact ? `[REPEAT CONTACT] ${emailSubject}` : emailSubject;
      await forwardToAdmin(senderEmail, escalateSubject, classified.summary, "complaint");
      return NextResponse.json({ success: true, action: "escalated_sentiment" });
    }

    switch (classified.category) {
      case "simple_question":
        // Only auto-reply if confidence is high enough
        if (classified.confidence < 0.7) {
          console.log(`Low confidence (${classified.confidence}) for simple_question — escalating to admin`);
          const lowConfSubject = isRepeatContact ? `[REPEAT CONTACT] ${emailSubject}` : emailSubject;
          await forwardToAdmin(senderEmail, lowConfSubject, classified.summary, "complaint");
          return NextResponse.json({ success: true, action: "escalated_low_confidence" });
        }
        if (classified.autoReply) {
          await getResend().emails.send({
            from: "Shadhin.io Support <help@shadhin.io>",
            to: senderEmail,
            subject: `Re: ${emailSubject.slice(0, 200)}`,
            text: classified.autoReply,
            headers: { "Auto-Submitted": "auto-replied" },
          });
        }
        return NextResponse.json({ success: true, action: "auto_replied" });

      case "complaint": {
        const complaintSubject = isRepeatContact ? `[REPEAT CONTACT] ${emailSubject}` : emailSubject;
        await forwardToAdmin(senderEmail, complaintSubject, classified.summary, "complaint");
        return NextResponse.json({ success: true, action: "escalated_complaint" });
      }

      case "legal_urgent": {
        const urgentSubject = isRepeatContact ? `[REPEAT CONTACT] ${emailSubject}` : emailSubject;
        await forwardToAdmin(senderEmail, urgentSubject, classified.summary, "urgent");

        // Push notification to admin
        const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
        if (admin) {
          await sendPushToUser(
            admin.id,
            "🚨 Urgent Support Email",
            `From: ${senderEmail} — ${classified.summary.slice(0, 100)}`,
            "/admin"
          ).catch(() => {});
        }

        // Auto-acknowledge to sender
        const ackText = classified.language === "bn"
          ? "আপনার বার্তার জন্য ধন্যবাদ। এটি জরুরি হিসেবে চিহ্নিত করা হয়েছে এবং আমাদের টিম দ্রুত উত্তর দেবে।\n\n- Shadhin.io টিম"
          : "Thank you for reaching out. Your message has been flagged as urgent and our team has been notified. We will respond as soon as possible.\n\n- Shadhin.io Team";

        await getResend().emails.send({
          from: "Shadhin.io Support <help@shadhin.io>",
          to: senderEmail,
          subject: `Re: ${emailSubject.slice(0, 200)}`,
          text: ackText,
          headers: { "Auto-Submitted": "auto-replied" },
        });
        return NextResponse.json({ success: true, action: "escalated_urgent" });
      }

      default:
        await forwardToAdmin(senderEmail, emailSubject, emailBody, "unclassified");
        return NextResponse.json({ success: true, action: "forwarded" });
    }
  } catch (error) {
    console.error("Email webhook error:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

const SUPPORT_PROMPT = `You are a bilingual support agent for Shadhin.io, a Bangladeshi community platform.

Platform knowledge:
- Users create posts and events in their district (9 Bangladesh divisions)
- Login via Google OAuth or email/password
- Password reset: https://shadhin.io/forgot-password
- Events can be promoted (paid via bKash): 3 days/৳50, 7 days/৳100, 14 days/৳200
- Organizations can apply for verified badges (one-time fee)
- Users get suspended after 3 community guideline strikes
- Contact admin directly: help@shadhin.io
- Privacy policy: https://shadhin.io/privacy
- Terms of service: https://shadhin.io/terms

Classify the support email below and follow these rules:
1. Rate your confidence 0.0-1.0 in your category classification.
2. Detect the sender's sentiment: positive, neutral, frustrated, or angry.
3. Tag the email with 1-3 topics (e.g. login, events, billing, bug, account, moderation, privacy, safety).
4. Detect the email language (bn, en, or mixed).
5. For simple_question: write an autoReply with 2-3 specific actionable steps. Include relevant URLs where helpful. Keep it under 150 words. Always end with: "If this doesn't help, reply to this email or contact help@shadhin.io"
   - For Bangla emails, write the entire reply in Bangla.
   - For English emails, write in English.
   - For mixed-language emails, write both a Bangla and an English version.
6. For complaint or legal_urgent: set autoReply to empty string "".`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    category: {
      type: "string",
      enum: ["simple_question", "complaint", "legal_urgent"],
      description: "simple_question = how-to / FAQ, complaint = bug or moderation dispute, legal_urgent = legal/safety/data deletion",
    },
    confidence: {
      type: "number",
      description: "0.0 to 1.0 confidence in the classification",
    },
    sentiment: {
      type: "string",
      enum: ["positive", "neutral", "frustrated", "angry"],
      description: "Detected sentiment/tone of the email",
    },
    summary: {
      type: "string",
      description: "2-sentence summary of the email",
    },
    language: {
      type: "string",
      enum: ["bn", "en", "mixed"],
      description: "Detected language of the email",
    },
    autoReply: {
      type: "string",
      description: "Helpful reply in sender's language if simple_question. Empty string if not simple_question.",
    },
    topics: {
      type: "array",
      items: { type: "string" },
      description: "1-3 topic tags like login, events, billing, bug, account, moderation",
    },
  },
  required: ["category", "confidence", "sentiment", "summary", "language", "autoReply", "topics"],
};

async function classifyEmail(
  subject: string,
  body: string
): Promise<ClassifiedEmail | null> {
  // Primary: Gemini 2.5 Flash — fallback: Claude Haiku
  const geminiKey = process.env.GOOGLE_AI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (geminiKey) {
    const result = await classifyWithGemini(geminiKey, subject, body);
    if (result) return result;
    console.warn("Gemini classification failed, trying Claude fallback");
  }
  if (anthropicKey) {
    const result = await classifyWithClaude(anthropicKey, subject, body);
    if (result) return result;
    console.warn("Claude classification also failed");
  }
  return null;
}

async function classifyWithGemini(
  apiKey: string,
  subject: string,
  body: string
): Promise<ClassifiedEmail | null> {
  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${SUPPORT_PROMPT}\n\nSubject: ${subject}\nBody: ${body.slice(0, 1000)}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 600,
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("Gemini API error:", response.status, await response.text().catch(() => ""));
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error("Gemini empty response:", JSON.stringify(data).slice(0, 200));
      return null;
    }

    const parsed = JSON.parse(text) as ClassifiedEmail;
    // Normalize empty autoReply to null
    if (!parsed.autoReply) parsed.autoReply = null;
    return parsed;
  } catch (err) {
    console.error("Gemini classify error:", err instanceof Error ? err.message : "unknown");
    return null;
  }
}

async function classifyWithClaude(
  apiKey: string,
  subject: string,
  body: string
): Promise<ClassifiedEmail | null> {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        messages: [
          {
            role: "user",
            content: `${SUPPORT_PROMPT}\n\nSubject: ${subject}\nBody: ${body.slice(0, 1000)}\n\nRespond with ONLY valid JSON matching this schema:\n${JSON.stringify(RESPONSE_SCHEMA, null, 2)}`,
          },
        ],
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text = data.content?.[0]?.text;
    if (!text) return null;

    return JSON.parse(text) as ClassifiedEmail;
  } catch {
    return null;
  }
}

async function persistEmail(
  senderEmail: string,
  subject: string,
  body: string,
  category: string,
  summary: string | null,
  language: string | null,
  autoReply?: string | null,
  confidence?: number,
  sentiment?: string,
  topics?: string[]
) {
  try {
    await db.supportEmail.create({
      data: {
        senderEmail,
        subject,
        body: body.slice(0, 5000),
        category,
        summary: summary || undefined,
        language: language || undefined,
        autoReply: autoReply || undefined,
        confidence: confidence !== undefined ? String(confidence) : undefined,
        sentiment: sentiment || undefined,
        topics: topics?.length ? topics.join(",") : undefined,
        status: category === "legal_urgent" ? "escalated" : "open",
      },
    });
  } catch (err) {
    console.error("Failed to persist support email:", err instanceof Error ? err.message : "unknown");
  }
}

async function forwardToAdmin(
  senderEmail: string,
  subject: string,
  content: string,
  type: string
) {
  if (!ADMIN_EMAIL) {
    console.warn("ADMIN_EMAIL not set — skipping admin notification");
    return;
  }

  const typeLabels: Record<string, string> = {
    complaint: "Complaint",
    urgent: "🚨 URGENT",
    repeat_contact: "🔁 Repeat Contact",
    unclassified: "Unclassified",
    classification_failed: "Classification Failed",
  };

  await getResend().emails.send({
    from: "Shadhin.io Support <help@shadhin.io>",
    to: ADMIN_EMAIL,
    subject: `[${typeLabels[type] || type}] ${subject.slice(0, 200)}`,
    text: `From: ${senderEmail}\nSubject: ${subject}\nType: ${type}\n\n---\n\n${content}`,
    headers: { "Auto-Submitted": "auto-replied" },
  });
}
