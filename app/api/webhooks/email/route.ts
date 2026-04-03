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

type EmailCategory = "simple_question" | "complaint" | "legal_urgent";

interface ClassifiedEmail {
  category: EmailCategory;
  summary: string;
  language: "bn" | "en" | "mixed";
  autoReply: string | null;
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

    // Classify with Claude API
    const classified = await classifyEmail(emailSubject, emailBody);

    if (!classified) {
      await forwardToAdmin(senderEmail, emailSubject, emailBody, "classification_failed");
      await persistEmail(senderEmail, emailSubject, emailBody, "unclassified", null, null);
      return NextResponse.json({ success: true, action: "forwarded_fallback" });
    }

    // Persist to database
    await persistEmail(
      senderEmail,
      emailSubject,
      emailBody,
      classified.category,
      classified.summary,
      classified.language,
      classified.autoReply
    );

    switch (classified.category) {
      case "simple_question":
        if (classified.autoReply) {
          await getResend().emails.send({
            from: "Shadhin.io Support <help@shadhin.io>",
            to: senderEmail,
            subject: `Re: ${emailSubject.slice(0, 200)}`,
            text: classified.autoReply,
          });
        }
        return NextResponse.json({ success: true, action: "auto_replied" });

      case "complaint":
        await forwardToAdmin(senderEmail, emailSubject, classified.summary, "complaint");
        return NextResponse.json({ success: true, action: "escalated_complaint" });

      case "legal_urgent":
        await forwardToAdmin(senderEmail, emailSubject, classified.summary, "urgent");

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
        });
        return NextResponse.json({ success: true, action: "escalated_urgent" });

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
- Password reset: go to login page → "Forgot password?" → enter email → receive code → reset
- Events can be promoted (paid via bKash): 3 days/৳50, 7 days/৳100, 14 days/৳200
- Organizations can apply for verified badges (one-time fee)
- Users get suspended after 3 community guideline strikes
- Contact admin directly: help@shadhin.io
- Privacy policy: https://shadhin.io/privacy

Classify the support email below. Detect its language and respond accordingly.
- For simple_question: write a helpful autoReply in the SAME language as the email
- For complaint or legal_urgent: set autoReply to null`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    category: {
      type: "string",
      enum: ["simple_question", "complaint", "legal_urgent"],
      description: "simple_question = how-to / FAQ, complaint = bug or moderation dispute, legal_urgent = legal/safety/data deletion",
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
      nullable: true,
      description: "Helpful reply in sender's language if simple_question, null otherwise",
    },
  },
  required: ["category", "summary", "language", "autoReply"],
};

async function classifyEmail(
  subject: string,
  body: string
): Promise<ClassifiedEmail | null> {
  // Primary: Gemini 2.5 Flash — fallback: Claude Haiku
  const geminiKey = process.env.GOOGLE_AI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (geminiKey) return classifyWithGemini(geminiKey, subject, body);
  if (anthropicKey) return classifyWithClaude(anthropicKey, subject, body);
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

    if (!response.ok) return null;

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    return JSON.parse(text) as ClassifiedEmail;
  } catch {
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
  autoReply?: string | null
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
    unclassified: "Unclassified",
    classification_failed: "Classification Failed",
  };

  await getResend().emails.send({
    from: "Shadhin.io Support <help@shadhin.io>",
    to: ADMIN_EMAIL,
    subject: `[${typeLabels[type] || type}] ${subject.slice(0, 200)}`,
    text: `From: ${senderEmail}\nSubject: ${subject}\nType: ${type}\n\n---\n\n${content}`,
  });
}
