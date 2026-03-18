import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";
import EmailLayout, { emailStyles } from "./components/EmailLayout";

const baseUrl = process.env.FRONTEND_URL || "https://shadhin.io";

interface NewDistrictMemberEmailProps {
  memberName: string;
  stateName: string;
}

export const NewDistrictMemberEmail = ({
  memberName,
  stateName,
}: NewDistrictMemberEmailProps) => (
  <EmailLayout
    preview={`${memberName} just joined ${stateName} on Shadhin.io!`}
  >
    <Heading style={emailStyles.heading}>New member in your district!</Heading>
    <Text style={emailStyles.paragraph}>
      <strong>{memberName}</strong> just joined the{" "}
      <strong>{stateName}</strong> community on Shadhin.io. Say hello and make
      them feel welcome!
    </Text>
    <Section style={emailStyles.buttonContainer}>
      <Button style={emailStyles.button} href={`${baseUrl}/events/${stateName}`}>
        Visit {stateName}
      </Button>
    </Section>
  </EmailLayout>
);

NewDistrictMemberEmail.PreviewProps = {
  memberName: "Rhidoy",
  stateName: "dhaka",
} as NewDistrictMemberEmailProps;

export default NewDistrictMemberEmail;
