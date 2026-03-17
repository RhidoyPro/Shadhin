import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";

interface AdminSummaryEmailProps {
  date: string;
  newUsers: number;
  newPosts: number;
  newReports: number;
  newComments: number;
  newLikes: number;
}

const baseUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}` : "";

export const AdminSummaryEmail = ({
  date,
  newUsers,
  newPosts,
  newReports,
  newComments,
  newLikes,
}: AdminSummaryEmailProps) => (
  <Html>
    <Head />
    <Preview>Shadhin.io Admin Summary — {date}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>Shadhin.io</Text>
        <Heading style={heading}>Daily Admin Summary — {date}</Heading>
        <Text style={paragraph}>Here's what happened in the last 24 hours:</Text>
        <Text style={paragraph}>New Users: <strong>{newUsers}</strong></Text>
        <Text style={paragraph}>New Posts: <strong>{newPosts}</strong></Text>
        <Text style={paragraph}>New Comments: <strong>{newComments}</strong></Text>
        <Text style={paragraph}>New Likes: <strong>{newLikes}</strong></Text>
        <Text style={paragraph}>New Reports: <strong>{newReports}</strong></Text>
        <Hr style={hr} />
        <Link href={`${baseUrl}/admin`} style={reportLink}>
          View Admin Dashboard
        </Link>
      </Container>
    </Body>
  </Html>
);

AdminSummaryEmail.PreviewProps = {
  date: "March 17, 2026",
  newUsers: 12,
  newPosts: 34,
  newReports: 2,
  newComments: 56,
  newLikes: 89,
} as AdminSummaryEmailProps;

export default AdminSummaryEmail;

const logo = { fontSize: "30px", fontWeight: "700", color: "#16a34a", margin: "0 0 10px" };
const main = { backgroundColor: "#ffffff", fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif' };
const container = { margin: "0 auto", padding: "20px 0 48px", maxWidth: "560px" };
const heading = { fontSize: "24px", letterSpacing: "-0.5px", lineHeight: "1.3", fontWeight: "400", color: "#484848", padding: "17px 0 0" };
const paragraph = { margin: "0 0 10px", fontSize: "15px", lineHeight: "1.4", color: "#3c4149" };
const reportLink = { fontSize: "14px", color: "#16a34a" };
const hr = { borderColor: "#dfe1e4", margin: "42px 0 26px" };
