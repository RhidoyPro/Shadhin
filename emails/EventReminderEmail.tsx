import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface EventReminderEmailProps {
  eventContent: string;
  eventDate: string;
  stateName: string;
  eventId: string;
  creatorName: string;
  hoursUntil: number;
}

const baseUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}` : "";

export const EventReminderEmail = ({
  eventContent,
  eventDate,
  stateName,
  eventId,
  creatorName,
  hoursUntil,
}: EventReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>
      Event reminder: {eventContent.slice(0, 50)} starts in ~{String(hoursUntil)}h
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>Shadhin.io</Text>
        <Heading style={heading}>
          {hoursUntil <= 3 ? "Starting soon!" : "Tomorrow's event"}
        </Heading>
        <Text style={paragraph}>
          An event you RSVP'd to is starting {hoursUntil <= 3 ? "in about 2 hours" : "tomorrow"}:
        </Text>
        <Section style={eventBox}>
          <Text style={eventTitle}>{eventContent.slice(0, 200)}</Text>
          <Text style={eventMeta}>
            By {creatorName} in {stateName} &middot; {eventDate}
          </Text>
        </Section>
        <Section style={buttonContainer}>
          <Button style={button} href={`${baseUrl}/events/details/${eventId}`}>
            View Event
          </Button>
        </Section>
        <Hr style={hr} />
        <Link href={baseUrl} style={reportLink}>
          Shadhin.io - All rights reserved 2025
        </Link>
      </Container>
    </Body>
  </Html>
);

EventReminderEmail.PreviewProps = {
  eventContent: "Community meetup at Hatirjheel park",
  eventDate: "March 20, 2025 at 3:00 PM",
  stateName: "dhaka",
  eventId: "abc123",
  creatorName: "Rhidoy",
  hoursUntil: 24,
} as EventReminderEmailProps;

export default EventReminderEmail;

const logo = { fontSize: "30px", fontWeight: "700", color: "#16a34a", margin: "0 0 10px" };
const main = { backgroundColor: "#ffffff", fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif' };
const container = { margin: "0 auto", padding: "20px 0 48px", maxWidth: "560px" };
const heading = { fontSize: "24px", letterSpacing: "-0.5px", lineHeight: "1.3", fontWeight: "400", color: "#484848", padding: "17px 0 0" };
const paragraph = { margin: "0 0 15px", fontSize: "15px", lineHeight: "1.4", color: "#3c4149" };
const eventBox = { backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px", margin: "16px 0" };
const eventTitle = { fontSize: "16px", fontWeight: "600", color: "#111827", margin: "0 0 8px" };
const eventMeta = { fontSize: "13px", color: "#6b7280", margin: "0" };
const buttonContainer = { padding: "27px 0 27px" };
const button = { backgroundColor: "#16a34a", borderRadius: "3px", fontWeight: "600", color: "#fff", fontSize: "15px", textDecoration: "none", textAlign: "center" as const, display: "block", padding: "11px 23px" };
const reportLink = { fontSize: "14px", color: "#b4becc" };
const hr = { borderColor: "#dfe1e4", margin: "42px 0 26px" };
