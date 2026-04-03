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
          // Get the email ID for feedback links
          const saved = await db.supportEmail.findFirst({
            where: { senderEmail, subject: emailSubject },
            orderBy: { createdAt: "desc" },
            select: { id: true },
          });
          await getResend().emails.send({
            from: "Shadhin.io Support <help@shadhin.io>",
            to: senderEmail,
            subject: `Re: ${emailSubject.slice(0, 200)}`,
            text: classified.autoReply,
            html: autoReplyHtml(classified.autoReply, classified.language, saved?.id),
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
          html: urgentAckHtml(classified.language),
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

const SUPPORT_PROMPT = `You are a friendly, warm human support agent named "Shadhin Support" for Shadhin.io, a Bangladeshi community platform. Write like a real person — conversational, empathetic, and helpful. Never sound robotic or corporate.

Platform knowledge:
- Users create posts and events in their district (9 Bangladesh divisions: Dhaka, Chattogram, Khulna, Rajshahi, Sylhet, Barishal, Rangpur, Mymensingh)
- Login via Google OAuth or email/password
- Password reset: go to https://shadhin.io/forgot-password, enter your email, check inbox for code, enter code + new password
- Events can be promoted via bKash: 3 days/৳50, 7 days/৳100, 14 days/৳200. Go to your post → "Promote" button
- Organizations can apply for verified badges (one-time fee) in Settings
- Community guidelines: 3 strikes = suspension. Appeal via help@shadhin.io
- Privacy policy: https://shadhin.io/privacy
- Terms: https://shadhin.io/terms

Classify the email and follow these rules:
1. Rate confidence 0.0-1.0 in your classification.
2. Detect sentiment: positive, neutral, frustrated, or angry.
3. Tag 1-3 topics (login, events, billing, bug, account, moderation, privacy, safety, feature_request).
4. Detect language (bn, en, or mixed).
5. For simple_question autoReply:
   - Start with a warm greeting: "Hi there!" (English) or "আসসালামু আলাইকুম!" (Bangla)
   - Give 2-3 specific steps with URLs where relevant
   - Keep under 150 words
   - Sound like a helpful friend, not a chatbot
   - End with: "Hope that helps! If not, just reply to this email and a real person will jump in." (English) or "আশা করি এটা কাজে আসবে! না হলে এই ইমেইলে রিপ্লাই করুন, আমাদের টিম সাহায্য করবে।" (Bangla)
   - For Bangla emails: entire reply in Bangla
   - For English emails: in English
   - For mixed: write Bangla first, then English below a line break
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
        confidence: confidence !== undefined ? Number(confidence) : undefined,
        sentiment: sentiment || undefined,
        topics: topics?.length ? topics.join(",") : undefined,
        status: category === "legal_urgent" ? "escalated" : "open",
      },
    });
  } catch (err) {
    console.error("Failed to persist support email:", err instanceof Error ? err.message : "unknown");
  }
}

// ── Branded HTML email templates ─────────────────────────────────────────────

function brandedEmail(body: string, language?: string, feedbackId?: string): string {
  const isBn = language === "bn";
  const feedbackHtml = feedbackId
    ? `<div style="text-align:center;margin:28px 0 8px;padding-top:24px;border-top:1px solid #e5e7eb">
        <p style="font-size:14px;color:#6b7280;margin:0 0 12px">${isBn ? "এই উত্তর কি সাহায্যকর ছিল?" : "Was this helpful?"}</p>
        <a href="https://shadhin.io/api/v1/support-feedback?t=${feedbackId}&r=yes" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#16a34a 0%,#0d9488 100%);color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;margin:0 8px;box-shadow:0 2px 6px rgba(22,163,74,0.25)">👍 ${isBn ? "হ্যাঁ" : "Yes"}</a>
        <a href="https://shadhin.io/api/v1/support-feedback?t=${feedbackId}&r=no" style="display:inline-block;padding:12px 28px;background:#f3f4f6;color:#374151;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;margin:0 8px;border:1px solid #d1d5db;box-shadow:0 1px 3px rgba(0,0,0,0.05)">👎 ${isBn ? "না" : "No"}</a>
      </div>`
    : "";

  const signature = isBn
    ? `<div style="margin-top:28px;padding-top:20px;border-top:1px solid #f3f4f6;border-left:3px solid #16a34a;padding-left:16px">
        <table cellpadding="0" cellspacing="0" style="width:100%"><tr>
          <td style="width:52px;vertical-align:top;padding-right:14px">
            <img src="https://pub-81b012e4d7214ac491438e1df8c5bf00.r2.dev/logo.png" width="44" height="44" alt="Shadhin.io" style="border-radius:8px">
          </td>
          <td style="vertical-align:top">
            <p style="font-size:15px;font-weight:600;color:#111827;margin:0">Shadhin.io সাপোর্ট টিম</p>
            <p style="font-size:13px;color:#6b7280;margin:2px 0 0">Bangladesh's Community Platform</p>
            <p style="font-size:13px;margin:6px 0 0">
              <a href="https://shadhin.io" style="color:#16a34a;text-decoration:none;font-weight:500">shadhin.io</a>
              <span style="color:#d1d5db;margin:0 6px">·</span>
              <a href="mailto:help@shadhin.io" style="color:#16a34a;text-decoration:none;font-weight:500">help@shadhin.io</a>
            </p>
          </td>
        </tr></table>
      </div>`
    : `<div style="margin-top:28px;padding-top:20px;border-top:1px solid #f3f4f6;border-left:3px solid #16a34a;padding-left:16px">
        <table cellpadding="0" cellspacing="0" style="width:100%"><tr>
          <td style="width:52px;vertical-align:top;padding-right:14px">
            <img src="https://pub-81b012e4d7214ac491438e1df8c5bf00.r2.dev/logo.png" width="44" height="44" alt="Shadhin.io" style="border-radius:8px">
          </td>
          <td style="vertical-align:top">
            <p style="font-size:15px;font-weight:600;color:#111827;margin:0">Shadhin.io Support Team</p>
            <p style="font-size:13px;color:#6b7280;margin:2px 0 0">Bangladesh's Community Platform</p>
            <p style="font-size:13px;margin:6px 0 0">
              <a href="https://shadhin.io" style="color:#16a34a;text-decoration:none;font-weight:500">shadhin.io</a>
              <span style="color:#d1d5db;margin:0 6px">·</span>
              <a href="mailto:help@shadhin.io" style="color:#16a34a;text-decoration:none;font-weight:500">help@shadhin.io</a>
            </p>
          </td>
        </tr></table>
      </div>`;

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="color-scheme" content="light dark">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  @media (prefers-color-scheme: dark) {
    .email-body { background: #1a1a2e !important; }
    .email-card { background: #1e293b !important; border-color: #334155 !important; box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important; }
    .email-heading { color: #f1f5f9 !important; }
    .email-text { color: #cbd5e1 !important; }
    .email-muted { color: #94a3b8 !important; }
    .email-info-box { background: #1e293b !important; border-color: #334155 !important; }
    .email-sig-name { color: #f1f5f9 !important; }
    .email-sig-sub { color: #94a3b8 !important; }
    .email-footer-text { color: #94a3b8 !important; }
    .email-footer-copy { color: #64748b !important; }
    .email-divider { border-color: #334155 !important; }
    .email-no-btn { background: #334155 !important; color: #cbd5e1 !important; border-color: #475569 !important; }
  }
  @media only screen and (max-width: 480px) {
    .email-content { padding-left: 20px !important; padding-right: 20px !important; }
    .email-header { padding-left: 20px !important; padding-right: 20px !important; }
    .email-wrapper { padding-left: 8px !important; padding-right: 8px !important; }
  }
</style>
</head>
<body class="email-body" style="margin:0;padding:0;background:#f6f9fc;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px">
<div class="email-wrapper" style="max-width:580px;margin:0 auto;padding:24px 12px 48px">
  <div class="email-card" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);border:1px solid #e5e7eb">
    <div style="height:4px;background:linear-gradient(135deg,#16a34a 0%,#0d9488 100%)"></div>
    <div class="email-header" style="padding:28px 32px 8px;text-align:center">
      <img src="https://pub-81b012e4d7214ac491438e1df8c5bf00.r2.dev/logo.png" width="40" height="40" alt="Shadhin.io" style="display:block;margin:0 auto;border-radius:8px">
      <p class="email-heading" style="font-size:20px;font-weight:700;color:#16a34a;margin:10px 0 0;letter-spacing:-0.02em">Shadhin.io</p>
    </div>
    <div class="email-content" style="padding:8px 32px 32px">
      ${body}
      ${signature}
      ${feedbackHtml}
    </div>
  </div>
  <div style="padding:20px 16px;text-align:center">
    <p class="email-footer-text" style="font-size:13px;color:#6b7280;margin:0">${isBn ? "বাংলাদেশের কমিউনিটি প্ল্যাটফর্ম" : "Bangladesh's Community Platform"} · <a href="https://shadhin.io" style="color:#16a34a;text-decoration:none">shadhin.io</a></p>
    <p class="email-footer-copy" style="font-size:11px;color:#6b7280;margin:6px 0 0">© ${new Date().getFullYear()} Shadhin.io</p>
  </div>
</div>
</body></html>`;
}

function autoReplyHtml(reply: string, language?: string, feedbackId?: string): string {
  const formatted = reply
    .split("\n\n").map(p => `<p class="email-text" style="font-size:16px;line-height:1.7;color:#374151;margin:0 0 14px">${p.replace(/\n/g, "<br>")}</p>`).join("");
  return brandedEmail(formatted, language, feedbackId);
}

function urgentAckHtml(language: string): string {
  const content = language === "bn"
    ? `<p class="email-text" style="font-size:16px;line-height:1.7;color:#374151;margin:0 0 14px">আসসালামু আলাইকুম,</p>
       <p class="email-text" style="font-size:16px;line-height:1.7;color:#374151;margin:0 0 14px">আপনার ইমেইল পেয়েছি। আপনার বিষয়টি <strong style="color:#dc2626">জরুরি</strong> হিসেবে চিহ্নিত করা হয়েছে এবং আমাদের টিমকে জানানো হয়েছে।</p>
       <p class="email-text" style="font-size:16px;line-height:1.7;color:#374151;margin:0 0 14px">আমরা যত দ্রুত সম্ভব আপনার সাথে যোগাযোগ করব। জরুরি প্রয়োজনে সরাসরি <a href="mailto:help@shadhin.io" style="color:#16a34a;font-weight:500">help@shadhin.io</a> এ লিখুন।</p>`
    : `<p class="email-text" style="font-size:16px;line-height:1.7;color:#374151;margin:0 0 14px">Hi there,</p>
       <p class="email-text" style="font-size:16px;line-height:1.7;color:#374151;margin:0 0 14px">We've received your message and it has been marked as <strong style="color:#dc2626">urgent</strong>. Our team has been notified immediately.</p>
       <p class="email-text" style="font-size:16px;line-height:1.7;color:#374151;margin:0 0 14px">We'll get back to you as quickly as possible. For anything critical, you can also reach us directly at <a href="mailto:help@shadhin.io" style="color:#16a34a;font-weight:500">help@shadhin.io</a>.</p>`;
  return brandedEmail(content, language);
}

function adminAlertHtml(senderEmail: string, subject: string, content: string, type: string): string {
  const colors: Record<string, string> = {
    complaint: "#f59e0b",
    urgent: "#ef4444",
    repeat_contact: "#8b5cf6",
    unclassified: "#6b7280",
    classification_failed: "#6b7280",
  };
  const color = colors[type] || "#6b7280";
  const label = type.replace(/_/g, " ").toUpperCase();

  return brandedEmail(`
    <div style="background:${color}15;border-left:4px solid ${color};padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 20px">
      <p style="font-size:12px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:1px;margin:0">${label}</p>
    </div>
    <table style="width:100%;font-size:14px;margin:0 0 20px">
      <tr><td class="email-muted" style="padding:6px 0;color:#6b7280;width:70px"><strong>From:</strong></td><td class="email-text" style="padding:6px 0;color:#374151">${senderEmail}</td></tr>
      <tr><td class="email-muted" style="padding:6px 0;color:#6b7280"><strong>Subject:</strong></td><td class="email-text" style="padding:6px 0;color:#374151">${subject}</td></tr>
    </table>
    <div class="email-info-box" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:0 0 16px">
      <p class="email-text" style="font-size:16px;line-height:1.6;color:#374151;margin:0;white-space:pre-wrap">${content}</p>
    </div>
    <p class="email-muted" style="font-size:14px;color:#6b7280;margin:0">Reply directly to this email or view in admin dashboard.</p>
  `);
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
    html: adminAlertHtml(senderEmail, subject, content, type),
    headers: { "Auto-Submitted": "auto-replied" },
  });
}
