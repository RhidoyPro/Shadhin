import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import {
  apiAuthPrefix,
  authRoutes,
  DEFAULT_LOGIN_REDIRECT,
  publicRoutes,
  adminRoutes,
} from "./routes";

const { auth } = NextAuth(authConfig);

// Social media and search engine crawlers that need access to OG meta tags
const CRAWLER_USER_AGENTS = [
  "facebookexternalhit",
  "Facebot",
  "Twitterbot",
  "LinkedInBot",
  "Slackbot",
  "WhatsApp",
  "TelegramBot",
  "Googlebot",
  "bingbot",
  "Discordbot",
];

export default auth((req) => {
  // CVE-2025-29927: Strip spoofed internal header to prevent middleware bypass
  const requestHeaders = new Headers(req.headers);
  requestHeaders.delete("x-middleware-subrequest");

  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session;
  const role = session?.user?.role;

  const isApiRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isMobileApi = nextUrl.pathname.startsWith("/api/v1/");
  const isCronRoute = nextUrl.pathname.startsWith("/api/cron/");
  const isOgRoute = nextUrl.pathname.startsWith("/api/og");
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isAdminRoute = adminRoutes.includes(nextUrl.pathname);

  // Allow social media crawlers through to event/user pages so OG tags render
  const ua = req.headers.get("user-agent") || "";
  const isCrawler = CRAWLER_USER_AGENTS.some((bot) =>
    ua.toLowerCase().includes(bot.toLowerCase())
  );
  const isCrawlablePath =
    nextUrl.pathname.startsWith("/events/details/") ||
    nextUrl.pathname.startsWith("/user/") ||
    nextUrl.pathname.startsWith("/events/");

  if (isCrawler && isCrawlablePath) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const isWebhookRoute = nextUrl.pathname.startsWith("/api/webhooks/");

  if (isApiRoute || isMobileApi || isCronRoute || isOgRoute || isWebhookRoute) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      const userDistrict = session?.user?.stateName;
      const redirectPath = userDistrict
        ? `/events/${userDistrict}`
        : DEFAULT_LOGIN_REDIRECT;
      return NextResponse.redirect(new URL(redirectPath, nextUrl));
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (role !== "ADMIN" && role !== "SUPER_USER") {
      return NextResponse.redirect(new URL("/forbidden", nextUrl));
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (isLoggedIn && session?.user?.isSuspended) {
    const isSuspendedPage = nextUrl.pathname === "/suspended";
    if (!isSuspendedPage && !isPublicRoute && !isAuthRoute) {
      return NextResponse.redirect(new URL("/suspended", nextUrl));
    }
  }

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
