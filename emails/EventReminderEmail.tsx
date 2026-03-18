import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout, { emailStyles } from "./components/EmailLayout";

const baseUrl = process.env.FRONTEND_URL || "https://shadhin.io";

interface EventReminderEmailProps {
  eventContent: string;
  eventDate: string;
  stateName: string;
  eventId: string;
  creatorName: string;
  hoursUntil: number;
}

export const EventReminderEmail = ({
  eventContent,
  eventDate,
  stateName,
  eventId,
  creatorName,
  hoursUntil,
}: EventReminderEmailProps) => (
  <EmailLayout
    preview={`Event reminder: ${eventContent.slice(0, 50)} starts in ~${hoursUntil}h`}
  >
    <Heading style={emailStyles.heading}>
      {hoursUntil <= 3 ? "Starting soon!" : "Tomorrow's event"}
    </Heading>
    <Text style={emailStyles.paragraph}>
      An event you RSVP'd to is starting{" "}
      {hoursUntil <= 3 ? "in about 2 hours" : "tomorrow"}:
    </Text>
    <Section style={emailStyles.infoBox}>
      <Text style={{ fontSize: "16px", fontWeight: "600", color: "#111827", margin: "0 0 8px" }}>
        {eventContent.slice(0, 200)}
      </Text>
      <Text style={emailStyles.mutedText}>
        By {creatorName} in {stateName} &middot; {eventDate}
      </Text>
    </Section>
    <Section style={emailStyles.buttonContainer}>
      <Button
        style={emailStyles.button}
        href={`${baseUrl}/events/details/${eventId}`}
      >
        View Event
      </Button>
    </Section>
  </EmailLayout>
);

EventReminderEmail.PreviewProps = {
  eventContent: "Community meetup at Hatirjheel park",
  eventDate: "March 20, 2026 at 3:00 PM",
  stateName: "dhaka",
  eventId: "abc123",
  creatorName: "Rhidoy",
  hoursUntil: 24,
} as EventReminderEmailProps;

export default EventReminderEmail;
