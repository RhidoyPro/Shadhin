import * as React from "react";
import {
  Body,
  Container,
  Column,
  Head,
  Heading,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

const baseUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}` : "";

interface BroadcastAnnouncementEmailProps {
  subject: string;
  message: string;
}

export const BroadcastAnnouncementEmail = ({
  subject,
  message,
}: BroadcastAnnouncementEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={main}>
        <Container>
          <Section style={logo}>
            <Text style={logoText}>Shadhin.io</Text>
          </Section>

          <Section style={content}>
            <Row style={boxInfos}>
              <Column>
                <Heading
                  style={{
                    fontSize: 26,
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  {subject}
                </Heading>

                <Text style={paragraph}>{message}</Text>
              </Column>
            </Row>
          </Section>

          <Text
            style={{
              textAlign: "center",
              fontSize: 12,
              color: "rgb(0,0,0, 0.7)",
            }}
          >
            Shadhin.io - All rights reserved 2025
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

BroadcastAnnouncementEmail.PreviewProps = {
  subject: "Important Announcement",
  message: "This is a test broadcast message from the admin team.",
} as BroadcastAnnouncementEmailProps;

export default BroadcastAnnouncementEmail;

const main = {
  backgroundColor: "#fff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const paragraph = {
  fontSize: 16,
  lineHeight: "1.6",
  whiteSpace: "pre-wrap" as const,
};

const logo = {
  padding: "30px 20px",
};
const logoText = {
  fontSize: "30px",
  fontWeight: "700",
  color: "#16a34a",
  margin: "0 0 10px",
};

const content = {
  border: "1px solid rgb(0,0,0, 0.1)",
  borderRadius: "3px",
  overflow: "hidden",
};

const boxInfos = {
  padding: "20px",
};
