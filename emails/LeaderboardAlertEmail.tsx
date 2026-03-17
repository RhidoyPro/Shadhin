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

interface LeaderboardAlertEmailProps {
  name: string;
  previousRank: number;
  currentRank: number;
  points: number;
}

const baseUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}` : "";

export const LeaderboardAlertEmail = ({
  name,
  previousRank,
  currentRank,
  points,
}: LeaderboardAlertEmailProps) => {
  const dropped = currentRank > previousRank;
  return (
    <Html>
      <Head />
      <Preview>
        Leaderboard update: You{dropped ? " dropped" : " climbed"} to #{String(currentRank)}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>Shadhin.io</Text>
          <Heading style={heading}>
            {dropped ? "You dropped on the leaderboard" : "You're climbing the leaderboard!"}
          </Heading>
          <Text style={paragraph}>
            Hey {name}, your leaderboard position changed this week:
          </Text>
          <Section style={rankBox}>
            <Text style={rankText}>
              #{String(previousRank)} → #{String(currentRank)}
            </Text>
            <Text style={pointsText}>{String(points)} points</Text>
          </Section>
          <Text style={paragraph}>
            {dropped
              ? "Keep posting and engaging to climb back up!"
              : "Great work! Keep it up to reach the top!"}
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={`${baseUrl}/leaderboard`}>
              View Leaderboard
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
};

LeaderboardAlertEmail.PreviewProps = {
  name: "Rhidoy",
  previousRank: 3,
  currentRank: 5,
  points: 120,
} as LeaderboardAlertEmailProps;

export default LeaderboardAlertEmail;

const logo = { fontSize: "30px", fontWeight: "700", color: "#16a34a", margin: "0 0 10px" };
const main = { backgroundColor: "#ffffff", fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif' };
const container = { margin: "0 auto", padding: "20px 0 48px", maxWidth: "560px" };
const heading = { fontSize: "24px", letterSpacing: "-0.5px", lineHeight: "1.3", fontWeight: "400", color: "#484848", padding: "17px 0 0" };
const paragraph = { margin: "0 0 15px", fontSize: "15px", lineHeight: "1.4", color: "#3c4149" };
const rankBox = { backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px", margin: "16px 0", textAlign: "center" as const };
const rankText = { fontSize: "28px", fontWeight: "700", color: "#111827", margin: "0 0 4px" };
const pointsText = { fontSize: "14px", color: "#6b7280", margin: "0" };
const buttonContainer = { padding: "27px 0 27px" };
const button = { backgroundColor: "#16a34a", borderRadius: "3px", fontWeight: "600", color: "#fff", fontSize: "15px", textDecoration: "none", textAlign: "center" as const, display: "block", padding: "11px 23px" };
const reportLink = { fontSize: "14px", color: "#b4becc" };
const hr = { borderColor: "#dfe1e4", margin: "42px 0 26px" };
