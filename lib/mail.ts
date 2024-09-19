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

export const sendEventEmails = async (
  emails: string[],
  event: { stateName: string; id: string; createdAt: Date; createdBy: string }
) => {
  //resend can send 100 emails at once, so we need to chunk the emails
  const chunkedEmails = emails.reduce((acc, email, i) => {
    const index = Math.floor(i / 100);
    if (!acc[index]) {
      acc[index] = [];
    }
    acc[index].push(email);
    return acc;
  }, [] as string[][]);

  for (const chunk of chunkedEmails) {
    await resend.emails.send({
      from: "help@shadhin.io",
      to: chunk,
      subject: `New event in ${event.stateName}`,
      react: EventBroadcastEmail({
        stateName: event.stateName,
        eventId: event.id,
        createdAt: event.createdAt,
        createdBy: event.createdBy,
      }),
    });
  }
};
