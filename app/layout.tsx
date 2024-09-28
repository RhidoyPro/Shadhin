import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { SocketProvider } from "@/context/SocketProvider";
import NextTopLoader from "nextjs-toploader";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shadhin.io",
  description: "Free speech platform for bangladeshi people",
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
        <body className={inter.className}>
          <NextTopLoader color="#16a34a" />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SocketProvider>{children}</SocketProvider>
            <Toaster richColors />
          </ThemeProvider>
        </body>
        <GoogleAnalytics />
      </html>
    </SessionProvider>
  );
}
