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

interface WelcomeEmailProps {
  name: string;
  stateName: string;
}

const baseUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}` : "";

export const WelcomeEmail = ({ name, stateName }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Shadhin.io, {name}!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>Shadhin.io</Text>
        <Heading style={heading}>Welcome to Shadhin.io, {name}!</Heading>
        <Text style={paragraph}>
          You've joined the {stateName} community. Here's what you can do:
        </Text>
        <Text style={paragraph}>
          <strong>Post updates</strong> — Share what's happening in your district
        </Text>
        <Text style={paragraph}>
          <strong>Join events</strong> — RSVP to local events and meetups
        </Text>
        <Text style={paragraph}>
          <strong>Live chat</strong> — Connect with others in your district in real-time
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={`${baseUrl}/events/${stateName}`}>
            Explore Your District
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

WelcomeEmail.PreviewProps = {
  name: "Rhidoy",
  stateName: "dhaka",
} as WelcomeEmailProps;

export default WelcomeEmail;

const logo = { fontSize: "30px", fontWeight: "700", color: "#16a34a", margin: "0 0 10px" };
const main = { backgroundColor: "#ffffff", fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif' };
const container = { margin: "0 auto", padding: "20px 0 48px", maxWidth: "560px" };
const heading = { fontSize: "24px", letterSpacing: "-0.5px", lineHeight: "1.3", fontWeight: "400", color: "#484848", padding: "17px 0 0" };
const paragraph = { margin: "0 0 15px", fontSize: "15px", lineHeight: "1.4", color: "#3c4149" };
const buttonContainer = { padding: "27px 0 27px" };
const button = { backgroundColor: "#16a34a", borderRadius: "3px", fontWeight: "600", color: "#fff", fontSize: "15px", textDecoration: "none", textAlign: "center" as const, display: "block", padding: "11px 23px" };
const reportLink = { fontSize: "14px", color: "#b4becc" };
const hr = { borderColor: "#dfe1e4", margin: "42px 0 26px" };
