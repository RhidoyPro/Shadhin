import * as React from "react";
import {
  Body,
  Button,
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
import { format } from "date-fns";

const baseUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}` : "";

interface EventBroadcastEmailProps {
  stateName: string;
  eventId: string;
  createdAt: Date;
  createdBy: string;
}

export const EventBroadcastEmail = ({
  stateName,
  eventId,
  createdAt,
  createdBy,
}: EventBroadcastEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>New event in {stateName}</Preview>
      <Body style={main}>
        <Container>
          <Section style={logo}>
            <Text style={logoText}>Shadhin.io</Text>
          </Section>

          <Section style={content}>
            <Row style={{ ...boxInfos, paddingBottom: "0" }}>
              <Column>
                <Heading
                  style={{
                    fontSize: 32,
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  Hi there!
                </Heading>
                <Heading
                  as="h2"
                  style={{
                    fontSize: 26,
                    fontWeight: "bold",
                    textAlign: "center",
                  }}
                >
                  New event in {stateName}
                </Heading>

                <Text style={paragraph}>
                  <b>State Name: </b>
                  {stateName}
                </Text>
                <Text style={{ ...paragraph, marginTop: -5 }}>
                  <b>Event Created At: </b>
                  {format(new Date(createdAt), "MMMM dd, yyyy 'at' hh:mm a")}
                </Text>
                <Text style={{ ...paragraph, marginTop: -5 }}>
                  <b>Event Created By: </b>
                  {createdBy}
                </Text>
                <Text
                  style={{
                    color: "rgb(0,0,0, 0.5)",
                    fontSize: 14,
                    marginTop: -5,
                  }}
                >
                  Click the button below to view the event details.
                </Text>
              </Column>
            </Row>
            <Row style={{ ...boxInfos, paddingTop: "0" }}>
              <Column style={containerButton} colSpan={2}>
                <Button
                  style={button}
                  href={`${baseUrl}/events/details/${eventId}`}
                >
                  View Event
                </Button>
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
            Shadhin.io - All rights reserved 2024
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

EventBroadcastEmail.PreviewProps = {
  stateName: "California",
  eventId: "123",
  createdAt: new Date(),
  createdBy: "John Doe",
} as EventBroadcastEmailProps;

export default EventBroadcastEmail;

const main = {
  backgroundColor: "#fff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const paragraph = {
  fontSize: 16,
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

const containerButton = {
  display: "flex",
  justifyContent: "center",
  width: "100%",
};

const button = {
  backgroundColor: "#16a34a",
  borderRadius: 3,
  color: "#FFF",
  fontWeight: "bold",
  border: "1px solid rgb(0,0,0, 0.1)",
  cursor: "pointer",
  padding: "12px 30px",
  width: "100%",
  textAlign: "center" as const,
};

const content = {
  border: "1px solid rgb(0,0,0, 0.1)",
  borderRadius: "3px",
  overflow: "hidden",
};

const boxInfos = {
  padding: "20px",
};
