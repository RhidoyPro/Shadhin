import AccountVerificationEmail from "@/emails/AccountVerificationEmail";
import EventBroadcastEmail from "@/emails/EventBroadcastEmail";
import ResetPasswordEmail from "@/emails/ResetPasswordCodeEmail";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, token: string) => {
  await resend.emails.send({
    from: "help@shadhin.io",
    to: email,
    subject: "Verify your email address",
    react: AccountVerificationEmail({ token }),
  });
};

export const sendForgotPasswordEmail = async (email: string, code: string) => {
  await resend.emails.send({
    from: "help@shadhin.io",
    to: email,
    subject: "Reset your password",
    react: ResetPasswordEmail({ code }),
  });
};

const RECIPIENTS_PER_EMAIL = 50;
const MAX_BATCH_SIZE = 100;

export const sendEventEmails = async (
  emails: string[],
  event: { stateName: string; id: string; createdAt: Date; createdBy: string }
) => {
  // Group emails into chunks of 50 recipients
  const emailGroups = emails.reduce((acc, email, i) => {
    const groupIndex = Math.floor(i / RECIPIENTS_PER_EMAIL);
    if (!acc[groupIndex]) {
      acc[groupIndex] = [];
    }
    acc[groupIndex].push(email);
    return acc;
  }, [] as string[][]);

  // Prepare email data for each group
  const emailData = emailGroups.map((group) => ({
    from: "help@shadhin.io",
    to: group,
    subject: `New event in ${event.stateName}`,
    react: EventBroadcastEmail({
      stateName: event.stateName,
      eventId: event.id,
      createdAt: event.createdAt,
      createdBy: event.createdBy,
    }),
  }));

  // Send emails in batches of 100
  for (let i = 0; i < emailData.length; i += MAX_BATCH_SIZE) {
    const batch = emailData.slice(i, i + MAX_BATCH_SIZE);
    try {
      await resend.batch.send(batch);
      console.log(`Sent batch ${i / MAX_BATCH_SIZE + 1}`);
    } catch (error) {
      console.error(`Error sending batch ${i / MAX_BATCH_SIZE + 1}:`, error);
    }
  }
};
