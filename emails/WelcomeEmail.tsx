import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout, { emailStyles } from "./components/EmailLayout";

const baseUrl = process.env.FRONTEND_URL || "https://shadhin.io";

interface WelcomeEmailProps {
  name: string;
  stateName: string;
}

export const WelcomeEmail = ({ name, stateName }: WelcomeEmailProps) => (
  <EmailLayout preview={`Welcome to Shadhin.io, ${name}!`}>
    <Heading style={emailStyles.heading}>Welcome, {name}!</Heading>
    <Text style={emailStyles.paragraph}>
      You've joined the <strong>{stateName}</strong> community on Shadhin.io.
      Here's what you can do:
    </Text>
    <Text style={emailStyles.paragraph}>
      <strong>Post updates</strong> — Share what's happening in your district
      <br />
      <strong>Join events</strong> — RSVP to local events and meetups
      <br />
      <strong>Live chat</strong> — Connect with others in real-time
    </Text>
    <Section style={emailStyles.buttonContainer}>
      <Button style={emailStyles.button} href={`${baseUrl}/events/${stateName}`}>
        Explore Your District
      </Button>
    </Section>
  </EmailLayout>
);

WelcomeEmail.PreviewProps = {
  name: "Rhidoy",
  stateName: "dhaka",
} as WelcomeEmailProps;

export default WelcomeEmail;
