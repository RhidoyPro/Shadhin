import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { rateLimit } from "@/lib/rate-limit";

let _resend: Resend | null = null;
const getResend = () => {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
};

type EmailCategory = "simple_question" | "complaint" | "legal_urgent";

interface ClassifiedEmail {
  category: EmailCategory;
  summary: string;
  autoReply: string | null;
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

/**
 * Inbound email webhook from Resend
 * Receives emails to support@shadhin.io, classifies them with Claude API,
 * auto-replies to simple questions, escalates complaints/urgent to admin
 */
export async function POST(req: NextRequest) {
  // Rate limit to prevent abuse (10 emails/min from any single IP)
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const limited = await rateLimit(`webhook-email:${ip}`, { limit: 10, windowSeconds: 60 });
  if (limited.limited) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  // Verify webhook secret if configured (set RESEND_WEBHOOK_SECRET in env)
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (webhookSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const body = await req.json();

    const { from, subject, text, html } = body;

    if (!from || !text) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const senderEmail = typeof from === "string" ? from : from.address || from;
    const emailBody = text || "";
    const emailSubject = subject || "(no subject)";

    // Classify with Claude API
    const classified = await classifyEmail(emailSubject, emailBody);

    if (!classified) {
      // If classification fails, forward to admin as-is
      await forwardToAdmin(senderEmail, emailSubject, emailBody, "classification_failed");
      return NextResponse.json({ success: true, action: "forwarded_fallback" });
    }

    switch (classified.category) {
      case "simple_question":
        // Auto-reply in Bengali/English
        if (classified.autoReply) {
          await getResend().emails.send({
            from: "Shadhin.io Support <help@shadhin.io>",
            to: senderEmail,
            subject: `Re: ${emailSubject.replace(/[\r\n]/g, '').slice(0, 200)}`,
            text: classified.autoReply,
          });
        }
        return NextResponse.json({ success: true, action: "auto_replied" });

      case "complaint":
        // Send admin a 2-line summary
        await forwardToAdmin(senderEmail, emailSubject, classified.summary, "complaint");
        return NextResponse.json({ success: true, action: "escalated_complaint" });

      case "legal_urgent":
        // Immediate alert to admin
        await forwardToAdmin(senderEmail, emailSubject, classified.summary, "urgent");
        // Also auto-acknowledge to sender
        await getResend().emails.send({
          from: "Shadhin.io Support <help@shadhin.io>",
          to: senderEmail,
          subject: `Re: ${emailSubject.replace(/[\r\n]/g, '').slice(0, 200)}`,
          text: "Thank you for reaching out. Your message has been flagged as urgent and our team has been notified. We will respond as soon as possible.\n\n- Shadhin.io Team",
        });
        return NextResponse.json({ success: true, action: "escalated_urgent" });

      default:
        await forwardToAdmin(senderEmail, emailSubject, emailBody, "unclassified");
        return NextResponse.json({ success: true, action: "forwarded" });
    }
  } catch (error) {
    console.error("Email webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function classifyEmail(
  subject: string,
  body: string
): Promise<ClassifiedEmail | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

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
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `You are a support email classifier for Shadhin.io, a Bangladeshi social platform. Classify this email and respond in JSON only.

Subject: ${subject}
Body: ${body.slice(0, 1000)}

Classify as one of:
- "simple_question" — general question about using the platform (how to post, reset password, find events, etc.)
- "complaint" — user is unhappy about something (bug report, moderation dispute, harassment report)
- "legal_urgent" — legal request, government inquiry, data deletion request, safety threat

Respond with ONLY this JSON (no markdown):
{
  "category": "simple_question" | "complaint" | "legal_urgent",
  "summary": "2-sentence summary of the email",
  "autoReply": "Helpful reply in both Bengali and English if simple_question, null otherwise"
}`,
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
    urgent: "URGENT",
    unclassified: "Unclassified",
    classification_failed: "Classification Failed",
  };

  const sanitizedSubject = subject.replace(/[\r\n]/g, '').slice(0, 200);

  await getResend().emails.send({
    from: "Shadhin.io Support <help@shadhin.io>",
    to: ADMIN_EMAIL,
    subject: `[${typeLabels[type] || type}] ${sanitizedSubject}`,
    text: `From: ${senderEmail}\nSubject: ${sanitizedSubject}\nType: ${type}\n\n---\n\n${content}`,
  });
}
