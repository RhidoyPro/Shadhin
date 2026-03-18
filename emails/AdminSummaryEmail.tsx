import { Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout, { emailStyles } from "./components/EmailLayout";

interface AdminSummaryEmailProps {
  date: string;
  newUsers: number;
  newPosts: number;
  newReports: number;
  newComments: number;
  newLikes: number;
}

export const AdminSummaryEmail = ({
  date,
  newUsers,
  newPosts,
  newReports,
  newComments,
  newLikes,
}: AdminSummaryEmailProps) => (
  <EmailLayout preview={`Shadhin.io Admin Summary — ${date}`}>
    <Heading style={emailStyles.heading}>Daily Summary — {date}</Heading>
    <Text style={emailStyles.paragraph}>
      Here's what happened on Shadhin.io in the last 24 hours:
    </Text>
    <Section style={emailStyles.infoBox}>
      <Text style={statRow}>New Users: <strong>{newUsers}</strong></Text>
      <Text style={statRow}>New Posts: <strong>{newPosts}</strong></Text>
      <Text style={statRow}>New Comments: <strong>{newComments}</strong></Text>
      <Text style={statRow}>New Likes: <strong>{newLikes}</strong></Text>
      <Text style={{ ...statRow, margin: "0" }}>New Reports: <strong>{newReports}</strong></Text>
    </Section>
  </EmailLayout>
);

AdminSummaryEmail.PreviewProps = {
  date: "March 18, 2026",
  newUsers: 12,
  newPosts: 34,
  newReports: 2,
  newComments: 56,
  newLikes: 89,
} as AdminSummaryEmailProps;

export default AdminSummaryEmail;

const statRow = {
  fontSize: "15px",
  lineHeight: "1.4",
  color: "#374151",
  margin: "0 0 8px",
};
