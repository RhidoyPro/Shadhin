import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout, { emailStyles } from "./components/EmailLayout";

const baseUrl = process.env.FRONTEND_URL || "https://shadhin.io";

interface DigestEvent {
  id: string;
  content: string;
  likes: number;
}

interface WeeklyDigestEmailProps {
  name: string;
  stateName: string;
  topEvents: DigestEvent[];
  newUsersCount: number;
}

export const WeeklyDigestEmail = ({
  name,
  stateName,
  topEvents,
  newUsersCount,
}: WeeklyDigestEmailProps) => (
  <EmailLayout preview={`This week in ${stateName} on Shadhin.io`}>
    <Heading style={emailStyles.heading}>Weekly Digest — {stateName}</Heading>
    <Text style={emailStyles.paragraph}>Hey {name}, here's what happened this week:</Text>

    {topEvents.length > 0 && (
      <Section style={emailStyles.infoBox}>
        <Text style={{ ...emailStyles.paragraph, fontWeight: "600", margin: "0 0 12px" }}>
          Top Posts
        </Text>
        {topEvents.map((event, i) => (
          <Text key={event.id} style={emailStyles.mutedText}>
            {i + 1}. {event.content.slice(0, 100)}
            {event.content.length > 100 ? "..." : ""} ({event.likes} likes)
          </Text>
        ))}
      </Section>
    )}

    {newUsersCount > 0 && (
      <Text style={emailStyles.paragraph}>
        <strong>{newUsersCount}</strong> new member
        {newUsersCount > 1 ? "s" : ""} joined {stateName} this week!
      </Text>
    )}

    <Section style={emailStyles.buttonContainer}>
      <Button style={emailStyles.button} href={`${baseUrl}/events/${stateName}`}>
        See Full Feed
      </Button>
    </Section>
  </EmailLayout>
);

WeeklyDigestEmail.PreviewProps = {
  name: "Rhidoy",
  stateName: "dhaka",
  topEvents: [
    { id: "1", content: "Community meetup this Saturday!", likes: 15 },
    { id: "2", content: "New food festival announced", likes: 12 },
  ],
  newUsersCount: 8,
} as WeeklyDigestEmailProps;

export default WeeklyDigestEmail;
