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

interface ResetPasswordEmailProps {
  code?: string;
}

const baseUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}` : "";

export const ResetPasswordEmail = ({ code }: ResetPasswordEmailProps) => (
  <Html>
    <Head />
    <Preview>Shadhin.io - Reset your password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={logo}>Shadhin.io</Text>
        <Heading style={heading}>
          You requested to reset your password. Use the code below to reset your
          password.
        </Heading>
        <Section style={codeBox}>
          <Text style={confirmationCodeText}>{code}</Text>
        </Section>
        <Text style={paragraph}>
          This code will only be valid for the next 10 min. If the code does not
          work, you can try to reset your password again and it will send you a
          new code.
        </Text>
        <Text style={paragraph}>
          If you didn't request to reset your password, you can ignore this
          email.
        </Text>
        <Hr style={hr} />
        <Link href={baseUrl} style={reportLink}>
          Shadhin.io - All rights reserved 2024
        </Link>
      </Container>
    </Body>
  </Html>
);

ResetPasswordEmail.PreviewProps = {
  code: "123456",
} as ResetPasswordEmailProps;

export default ResetPasswordEmail;

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

const codeBox = {
  background: "rgb(245, 244, 245)",
  borderRadius: "4px",
  marginBottom: "30px",
  padding: "40px 10px",
};

const confirmationCodeText = {
  fontSize: "30px",
  textAlign: "center" as const,
  verticalAlign: "middle",
};

const reportLink = {
  fontSize: "14px",
  color: "#b4becc",
};

const hr = {
  borderColor: "#dfe1e4",
  margin: "42px 0 26px",
};
