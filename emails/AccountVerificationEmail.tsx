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

interface AccountVerificationEmailProps {
  token?: string;
}

const baseUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}` : "";

export const AccountVerificationEmail = ({
  token,
}: AccountVerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Shadhin.io - Verify your email address</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>Shadhin.io</Text>
        <Heading style={heading}>
          Thanks for signing up for Shadhin.io! To complete your account setup,
          please verify your email address.
        </Heading>
        <Section style={buttonContainer}>
          <Button
            style={button}
            href={`${baseUrl}/verify-email?token=${token}`}
          >
            Verify Email
          </Button>
        </Section>
        <Text style={paragraph}>
          This link will only be valid for the next 1 hour. If the link does not
          work, you can try to login again and it will send you a new
          verification link.
        </Text>
        <Text style={paragraph}>
          If you didn't sign up for Shadhin.io, you can ignore this email. Your
          email address will not be verified.
        </Text>
        <Hr style={hr} />
        <Link href={baseUrl} style={reportLink}>
          Shadhin.io - All rights reserved 2024
        </Link>
      </Container>
    </Body>
  </Html>
);

AccountVerificationEmail.PreviewProps = {
  token: "tt226-5398x",
} as AccountVerificationEmailProps;

export default AccountVerificationEmail;

const logo = {
  fontSize: "30px",
  fontWeight: "700",
  color: "#16a34a",
  margin: "0 0 10px",
};

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
};

const heading = {
  fontSize: "24px",
  letterSpacing: "-0.5px",
  lineHeight: "1.3",
  fontWeight: "400",
  color: "#484848",
  padding: "17px 0 0",
};

const paragraph = {
  margin: "0 0 15px",
  fontSize: "15px",
  lineHeight: "1.4",
  color: "#3c4149",
};

const buttonContainer = {
  padding: "27px 0 27px",
};

const button = {
  backgroundColor: "#16a34a",
  borderRadius: "3px",
  fontWeight: "600",
  color: "#fff",
  fontSize: "15px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "11px 23px",
};

const reportLink = {
  fontSize: "14px",
  color: "#b4becc",
};

const hr = {
  borderColor: "#dfe1e4",
  margin: "42px 0 26px",
};
