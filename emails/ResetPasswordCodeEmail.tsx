import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout, { emailStyles } from "./components/EmailLayout";

interface ResetPasswordEmailProps {
  code?: string;
}

export const ResetPasswordEmail = ({ code }: ResetPasswordEmailProps) => (
  <EmailLayout preview="Shadhin.io — Reset your password">
    <Heading style={emailStyles.heading}>Reset your password</Heading>
    <Text style={emailStyles.paragraph}>
      You requested to reset your password. Use the code below to continue:
    </Text>
    <Section style={emailStyles.codeBox}>
      <Text style={emailStyles.codeText}>{code}</Text>
    </Section>
    <Text style={emailStyles.paragraph}>
      This code is valid for 10 minutes. If it doesn't work, request a new one
      from the forgot password page.
    </Text>
    <Text style={emailStyles.mutedText}>
      If you didn't request this, you can safely ignore this email.
    </Text>
  </EmailLayout>
);

ResetPasswordEmail.PreviewProps = {
  code: "25E42927",
} as ResetPasswordEmailProps;

export default ResetPasswordEmail;
