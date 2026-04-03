import AccountVerificationEmail from "@/emails/AccountVerificationEmail";
import EventBroadcastEmail from "@/emails/EventBroadcastEmail";
import EventReminderEmail from "@/emails/EventReminderEmail";
import LeaderboardAlertEmail from "@/emails/LeaderboardAlertEmail";
import NewDistrictMemberEmail from "@/emails/NewDistrictMemberEmail";
import ResetPasswordEmail from "@/emails/ResetPasswordCodeEmail";
import WelcomeEmail from "@/emails/WelcomeEmail";
import { Resend } from "resend";

let _resend: Resend | null = null;
const getResend = () => {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
};

const FROM = "Shadhin.io <help@shadhin.io>";
const REPLY_TO = "help@shadhin.io";

// Headers that improve deliverability and reduce spam scoring
const defaultHeaders = {
  "X-Entity-Ref-ID": `shadhin-${Date.now()}`,
};

export const sendVerificationEmail = async (email: string, token: string) => {
  await getResend().emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: email,
    subject: "Verify your email — Shadhin.io",
    headers: defaultHeaders,
    react: AccountVerificationEmail({ token }),
  });
};

export const sendForgotPasswordEmail = async (email: string, code: string) => {
  const { error } = await getResend().emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: email,
    subject: "Your password reset code — Shadhin.io",
    headers: defaultHeaders,
    react: ResetPasswordEmail({ code }),
  });

  if (error) {
    console.error("Resend error (password reset):", error);
    throw new Error(error.message || "Failed to send password reset email");
  }
};

export const sendWelcomeEmail = async (
  email: string,
  name: string,
  stateName: string
) => {
  await getResend().emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: email,
    subject: `Welcome to Shadhin.io, ${name}!`,
    headers: defaultHeaders,
    react: WelcomeEmail({ name, stateName }),
  });
};

export const sendEventReminderEmail = async (
  email: string,
  data: {
    eventContent: string;
    eventDate: string;
    stateName: string;
    eventId: string;
    creatorName: string;
    hoursUntil: number;
  }
) => {
  await getResend().emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: email,
    subject: `Event reminder: Starting ${data.hoursUntil <= 3 ? "soon" : "tomorrow"} — Shadhin.io`,
    headers: defaultHeaders,
    react: EventReminderEmail(data),
  });
};

export const sendNewDistrictMemberEmail = async (
  email: string,
  memberName: string,
  stateName: string
) => {
  await getResend().emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: email,
    subject: `${memberName} joined ${stateName} — Shadhin.io`,
    headers: defaultHeaders,
    react: NewDistrictMemberEmail({ memberName, stateName }),
  });
};

export const sendLeaderboardAlertEmail = async (
  email: string,
  data: {
    name: string;
    previousRank: number;
    currentRank: number;
    points: number;
  }
) => {
  await getResend().emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: email,
    subject: `Leaderboard update: You're now #${data.currentRank} — Shadhin.io`,
    headers: defaultHeaders,
    react: LeaderboardAlertEmail(data),
  });
};

const RECIPIENTS_PER_EMAIL = 50;
const MAX_BATCH_SIZE = 100;

export const sendEventEmails = async (
  emails: string[],
  event: { stateName: string; id: string; createdAt: Date; createdBy: string }
) => {
  const emailGroups = emails.reduce((acc, email, i) => {
    const groupIndex = Math.floor(i / RECIPIENTS_PER_EMAIL);
    if (!acc[groupIndex]) {
      acc[groupIndex] = [];
    }
    acc[groupIndex].push(email);
    return acc;
  }, [] as string[][]);

  const emailData = emailGroups.map((group) => ({
    from: FROM,
    replyTo: REPLY_TO,
    to: group,
    subject: `New event in ${event.stateName} — Shadhin.io`,
    headers: defaultHeaders,
    react: EventBroadcastEmail({
      stateName: event.stateName,
      eventId: event.id,
      createdAt: event.createdAt,
      createdBy: event.createdBy,
    }),
  }));

  for (let i = 0; i < emailData.length; i += MAX_BATCH_SIZE) {
    const batch = emailData.slice(i, i + MAX_BATCH_SIZE);
    try {
      await getResend().batch.send(batch);
    } catch (error) {
      console.error(`Error sending batch ${i / MAX_BATCH_SIZE + 1}:`, error);
    }
  }
};
