import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";

import NextTopLoader from "nextjs-toploader";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Shadhin.io — Bangladesh's District-Based Social Platform",
    template: "%s | Shadhin.io",
  },
  description:
    "Connect with your local community. Events, live chat, and discussions organized by Bangladesh's districts.",
  metadataBase: new URL(process.env.FRONTEND_URL || "https://shadhin.io"),
  openGraph: {
    type: "website",
    siteName: "Shadhin.io",
    title: "Shadhin.io — Bangladesh's District-Based Social Platform",
    description:
      "Connect with your local community. Events, live chat, and discussions organized by Bangladesh's districts.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shadhin.io",
    description:
      "Bangladesh's district-based social platform for events, chat, and community.",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Shadhin.io",
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <SessionProvider session={session}>
      <html lang="en">
        <head>
          <link rel="apple-touch-icon" href="/logo.png" />
          <meta name="mobile-web-app-capable" content="yes" />
        </head>
        <body className={inter.className}>
          <NextTopLoader color="#16a34a" />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster richColors />
          </ThemeProvider>
        </body>
        <GoogleAnalytics />
      </html>
    </SessionProvider>
  );
}
