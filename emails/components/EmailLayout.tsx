import * as React from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

const baseUrl = process.env.FRONTEND_URL || "https://shadhin.io";

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export const EmailLayout = ({ preview, children }: EmailLayoutProps) => (
  <Html>
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Green accent bar */}
        <Section style={accentBar} />

        {/* Logo header */}
        <Section style={header}>
          <Img
            src={`${baseUrl}/logo.png`}
            width="36"
            height="36"
            alt="Shadhin.io"
            style={logoImg}
          />
          <Text style={logoText}>Shadhin.io</Text>
        </Section>

        {/* Content */}
        <Section style={content}>{children}</Section>

        {/* Footer */}
        <Hr style={hr} />
        <Section style={footer}>
          <Text style={footerText}>
            Shadhin.io — Bangladesh's Community Platform
          </Text>
          <Text style={footerText}>
            <Link href={baseUrl} style={footerLink}>
              Visit Shadhin.io
            </Link>
          </Text>
          <Text style={footerMuted}>
            &copy; {new Date().getFullYear()} Shadhin.io. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default EmailLayout;

// Shared styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
};

const accentBar = {
  backgroundColor: "#16a34a",
  height: "4px",
  borderRadius: "4px 4px 0 0",
};

const header = {
  backgroundColor: "#ffffff",
  padding: "24px 32px 16px",
  textAlign: "center" as const,
};

const logoImg = {
  margin: "0 auto",
  display: "block" as const,
};

const logoText = {
  fontSize: "22px",
  fontWeight: "700" as const,
  color: "#16a34a",
  margin: "8px 0 0",
  textAlign: "center" as const,
};

const content = {
  backgroundColor: "#ffffff",
  padding: "0 32px 32px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "0",
};

const footer = {
  padding: "20px 32px",
  textAlign: "center" as const,
};

const footerText = {
  fontSize: "13px",
  lineHeight: "1.4",
  color: "#6b7280",
  margin: "0 0 4px",
};

const footerLink = {
  color: "#16a34a",
  textDecoration: "underline",
};

const footerMuted = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: "8px 0 0",
};

// Export shared styles for use in templates
export const emailStyles = {
  heading: {
    fontSize: "22px",
    fontWeight: "600" as const,
    color: "#111827",
    lineHeight: "1.3",
    margin: "0 0 16px",
  },
  paragraph: {
    fontSize: "15px",
    lineHeight: "1.6",
    color: "#374151",
    margin: "0 0 16px",
  },
  button: {
    backgroundColor: "#16a34a",
    borderRadius: "6px",
    fontWeight: "600" as const,
    color: "#fff",
    fontSize: "15px",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block" as const,
    padding: "12px 24px",
  },
  buttonContainer: {
    padding: "8px 0 16px",
  },
  infoBox: {
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "16px",
    margin: "16px 0",
  },
  codeBox: {
    backgroundColor: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "8px",
    padding: "24px",
    margin: "16px 0",
    textAlign: "center" as const,
  },
  codeText: {
    fontSize: "32px",
    fontWeight: "700" as const,
    color: "#16a34a",
    letterSpacing: "4px",
    margin: "0",
    fontFamily: "monospace",
  },
  mutedText: {
    fontSize: "13px",
    color: "#6b7280",
    margin: "0 0 8px",
  },
};
