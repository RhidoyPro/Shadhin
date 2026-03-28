import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { getLocale, getMessages } from "@/lib/i18n";
import { I18nProvider } from "@/components/I18nProvider";
import NextTopLoader from "nextjs-toploader";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import dynamic from "next/dynamic";

// Essential trackers — always load
const UTMCapture = dynamic(() => import("@/components/UTMCapture"), { ssr: false });
const ErrorTracker = dynamic(() => import("@/components/ErrorTracker"), { ssr: false });
const PWAInstallTracker = dynamic(() => import("@/components/PWAInstallTracker"), { ssr: false });

// Analytics category — consent-gated
const GoogleAnalytics = dynamic(() => import("@/components/GoogleAnalytics"), { ssr: false });
const MicrosoftClarity = dynamic(() => import("@/components/MicrosoftClarity"), { ssr: false });
const PostHogProvider = dynamic(() => import("@/components/PostHogProvider"), { ssr: false });
const EngagementTracker = dynamic(() => import("@/components/EngagementTracker"), { ssr: false });
const WebVitalsTracker = dynamic(() => import("@/components/WebVitalsTracker"), { ssr: false });
const SessionDepthTracker = dynamic(() => import("@/components/SessionDepthTracker"), { ssr: false });
const DistrictSwitchTracker = dynamic(() => import("@/components/DistrictSwitchTracker"), { ssr: false });

// Marketing category — consent-gated
const MetaPixel = dynamic(() => import("@/components/MetaPixel"), { ssr: false });

// Consent UI
const ConsentGate = dynamic(() => import("@/components/ConsentGate"), { ssr: false });
const CookieConsent = dynamic(() => import("@/components/CookieConsent"), { ssr: false });

const inter = Inter({ subsets: ["latin"], display: "swap" });

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
    images: [
      {
        url: "/bangladesh.jpg",
        width: 1200,
        height: 630,
        alt: "Shadhin.io — Bangladesh's District-Based Social Platform",
      },
    ],
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
  const locale = getLocale();
  const messages = getMessages(locale);
  return (
    <SessionProvider session={session}>
      <html lang={locale}>
        <head>
          <link rel="apple-touch-icon" href="/logo.png" />
          <meta name="mobile-web-app-capable" content="yes" />
          {/* R2 CDN — preconnect since images load early */}
          <link
            rel="preconnect"
            href="https://pub-81b012e4d7214ac491438e1df8c5bf00.r2.dev"
            crossOrigin="anonymous"
          />
          {/* Analytics origins — dns-prefetch only (scripts load afterInteractive, not during initial render) */}
          <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
          <link rel="dns-prefetch" href="https://www.google-analytics.com" />
          <link rel="dns-prefetch" href="https://www.clarity.ms" />
          <link rel="dns-prefetch" href="https://connect.facebook.net" />
          <link rel="dns-prefetch" href="https://us.i.posthog.com" />
        </head>
        <body className={inter.className}>
          <NextTopLoader color="#16a34a" />
          <I18nProvider locale={locale} messages={messages}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster richColors />
            </ThemeProvider>
          </I18nProvider>

          {/* ── Essential (always load) ── */}
          <UTMCapture />
          <ErrorTracker />
          <PWAInstallTracker />
          <Analytics />
          <SpeedInsights />

          {/* ── Analytics (consent-gated) ── */}
          <ConsentGate category="analytics">
            <GoogleAnalytics />
            <MicrosoftClarity />
            <PostHogProvider />
            <EngagementTracker />
            <WebVitalsTracker />
            <SessionDepthTracker />
            <DistrictSwitchTracker />
          </ConsentGate>

          {/* ── Marketing (consent-gated) ── */}
          <ConsentGate category="marketing">
            <MetaPixel />
          </ConsentGate>

          {/* ── Cookie consent banner ── */}
          <CookieConsent />
        </body>
      </html>
    </SessionProvider>
  );
}
