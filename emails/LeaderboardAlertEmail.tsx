import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout, { emailStyles } from "./components/EmailLayout";

const baseUrl = process.env.FRONTEND_URL || "https://shadhin.io";

interface LeaderboardAlertEmailProps {
  name: string;
  previousRank: number;
  currentRank: number;
  points: number;
}

export const LeaderboardAlertEmail = ({
  name,
  previousRank,
  currentRank,
  points,
}: LeaderboardAlertEmailProps) => {
  const dropped = currentRank > previousRank;
  return (
    <EmailLayout
      preview={`Leaderboard update: You${dropped ? " dropped" : " climbed"} to #${currentRank}`}
    >
      <Heading style={emailStyles.heading}>
        {dropped
          ? "You dropped on the leaderboard"
          : "You're climbing the leaderboard!"}
      </Heading>
      <Text style={emailStyles.paragraph}>
        Hey {name}, your leaderboard position changed this week:
      </Text>
      <Section style={emailStyles.codeBox}>
        <Text
          style={{
            fontSize: "28px",
            fontWeight: "700",
            color: "#111827",
            margin: "0 0 4px",
          }}
        >
          #{String(previousRank)} → #{String(currentRank)}
        </Text>
        <Text style={emailStyles.mutedText}>{String(points)} points</Text>
      </Section>
      <Text style={emailStyles.paragraph}>
        {dropped
          ? "Keep posting and engaging to climb back up!"
          : "Great work! Keep it up to reach the top!"}
      </Text>
      <Section style={emailStyles.buttonContainer}>
        <Button style={emailStyles.button} href={`${baseUrl}/leaderboard`}>
          View Leaderboard
        </Button>
      </Section>
    </EmailLayout>
  );
};

LeaderboardAlertEmail.PreviewProps = {
  name: "Rhidoy",
  previousRank: 3,
  currentRank: 5,
  points: 120,
} as LeaderboardAlertEmailProps;

export default LeaderboardAlertEmail;
