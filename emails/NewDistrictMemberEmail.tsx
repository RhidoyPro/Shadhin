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

interface NewDistrictMemberEmailProps {
  memberName: string;
  stateName: string;
}

const baseUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}` : "";

export const NewDistrictMemberEmail = ({
  memberName,
  stateName,
}: NewDistrictMemberEmailProps) => (
  <Html>
    <Head />
    <Preview>{memberName} just joined {stateName} on Shadhin.io!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>Shadhin.io</Text>
        <Heading style={heading}>New member in your district!</Heading>
        <Text style={paragraph}>
          <strong>{memberName}</strong> just joined the <strong>{stateName}</strong> community on Shadhin.io. Say hello and make them feel welcome!
        </Text>
        <Section style={buttonContainer}>
          <Button style={button} href={`${baseUrl}/events/${stateName}`}>
            Visit {stateName}
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

NewDistrictMemberEmail.PreviewProps = {
  memberName: "Rhidoy",
  stateName: "dhaka",
} as NewDistrictMemberEmailProps;

export default NewDistrictMemberEmail;

const logo = { fontSize: "30px", fontWeight: "700", color: "#16a34a", margin: "0 0 10px" };
const main = { backgroundColor: "#ffffff", fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif' };
const container = { margin: "0 auto", padding: "20px 0 48px", maxWidth: "560px" };
const heading = { fontSize: "24px", letterSpacing: "-0.5px", lineHeight: "1.3", fontWeight: "400", color: "#484848", padding: "17px 0 0" };
const paragraph = { margin: "0 0 15px", fontSize: "15px", lineHeight: "1.4", color: "#3c4149" };
const buttonContainer = { padding: "27px 0 27px" };
const button = { backgroundColor: "#16a34a", borderRadius: "3px", fontWeight: "600", color: "#fff", fontSize: "15px", textDecoration: "none", textAlign: "center" as const, display: "block", padding: "11px 23px" };
const reportLink = { fontSize: "14px", color: "#b4becc" };
const hr = { borderColor: "#dfe1e4", margin: "42px 0 26px" };
