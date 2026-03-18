import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout, { emailStyles } from "./components/EmailLayout";

const baseUrl = process.env.FRONTEND_URL || "https://shadhin.io";

interface AccountVerificationEmailProps {
  token?: string;
}

export const AccountVerificationEmail = ({
  token,
}: AccountVerificationEmailProps) => (
  <EmailLayout preview="Shadhin.io — Verify your email address">
    <Heading style={emailStyles.heading}>Verify your email address</Heading>
    <Text style={emailStyles.paragraph}>
      Thanks for signing up for Shadhin.io! Click the button below to verify
      your email and activate your account.
    </Text>
    <Section style={emailStyles.buttonContainer}>
      <Button
        style={emailStyles.button}
        href={`${baseUrl}/verify-email?token=${token}`}
      >
        Verify Email
      </Button>
    </Section>
    <Text style={emailStyles.mutedText}>
      This link is valid for 1 hour. If it expires, log in again to receive a
      new verification link.
    </Text>
    <Text style={emailStyles.mutedText}>
      If you didn't sign up for Shadhin.io, you can ignore this email.
    </Text>
  </EmailLayout>
);

AccountVerificationEmail.PreviewProps = {
  token: "tt226-5398x",
} as AccountVerificationEmailProps;

export default AccountVerificationEmail;
