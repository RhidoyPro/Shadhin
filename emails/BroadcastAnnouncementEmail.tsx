import { Heading, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout, { emailStyles } from "./components/EmailLayout";

interface BroadcastAnnouncementEmailProps {
  subject: string;
  message: string;
}

export const BroadcastAnnouncementEmail = ({
  subject,
  message,
}: BroadcastAnnouncementEmailProps) => (
  <EmailLayout preview={subject}>
    <Heading style={emailStyles.heading}>{subject}</Heading>
    <Text style={{ ...emailStyles.paragraph, whiteSpace: "pre-wrap" as const }}>
      {message}
    </Text>
  </EmailLayout>
);

BroadcastAnnouncementEmail.PreviewProps = {
  subject: "Important Announcement",
  message: "This is a test broadcast message from the admin team.",
} as BroadcastAnnouncementEmailProps;

export default BroadcastAnnouncementEmail;
