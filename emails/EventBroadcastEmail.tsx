import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import { format } from "date-fns";
import EmailLayout, { emailStyles } from "./components/EmailLayout";

const baseUrl = process.env.FRONTEND_URL || "https://shadhin.io";

interface EventBroadcastEmailProps {
  stateName: string;
  eventId: string;
  createdAt: Date;
  createdBy: string;
}

export const EventBroadcastEmail = ({
  stateName,
  eventId,
  createdAt,
  createdBy,
}: EventBroadcastEmailProps) => (
  <EmailLayout preview={`New event in ${stateName}`}>
    <Heading style={emailStyles.heading}>New event in {stateName}</Heading>
    <Section style={emailStyles.infoBox}>
      <Text style={{ fontSize: "14px", color: "#374151", margin: "0 0 6px" }}>
        <strong>District:</strong> {stateName}
      </Text>
      <Text style={{ fontSize: "14px", color: "#374151", margin: "0 0 6px" }}>
        <strong>Posted by:</strong> {createdBy}
      </Text>
      <Text style={{ fontSize: "14px", color: "#374151", margin: "0" }}>
        <strong>Date:</strong>{" "}
        {format(new Date(createdAt), "MMMM dd, yyyy 'at' hh:mm a")}
      </Text>
    </Section>
    <Text style={emailStyles.paragraph}>
      Check out the latest event in your district.
    </Text>
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

EventBroadcastEmail.PreviewProps = {
  stateName: "Dhaka",
  eventId: "123",
  createdAt: new Date(),
  createdBy: "John Doe",
} as EventBroadcastEmailProps;

export default EventBroadcastEmail;
