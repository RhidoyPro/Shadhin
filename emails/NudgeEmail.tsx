import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout, { emailStyles } from "./components/EmailLayout";

const baseUrl = process.env.FRONTEND_URL || "https://shadhin.io";

interface NudgeEmailProps {
  name: string;
  stateName: string;
}

export const NudgeEmail = ({ name, stateName }: NudgeEmailProps) => (
  <EmailLayout preview="Your district is waiting for you on Shadhin.io">
    <Heading style={emailStyles.heading}>Hey {name}, your district is waiting!</Heading>
    <Text style={emailStyles.paragraph}>
      You joined 3 days ago but haven't posted yet. Your{" "}
      <strong>{stateName}</strong> community would love to hear from you.
    </Text>
    <Text style={emailStyles.paragraph}>
      Share a quick update, ask a question, or tell people about an upcoming
      event.
    </Text>
    <Section style={emailStyles.buttonContainer}>
      <Button style={emailStyles.button} href={`${baseUrl}/events/${stateName}`}>
        Create Your First Post
      </Button>
    </Section>
  </EmailLayout>
);

NudgeEmail.PreviewProps = { name: "Rhidoy", stateName: "dhaka" } as NudgeEmailProps;
export default NudgeEmail;
