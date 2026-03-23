/**
 * Shadhin.io — Master Analytics Utility
 *
 * Single `track()` call sends to all active providers:
 *   • Google Analytics 4 (GA4)    — always
 *   • Meta/Facebook Pixel          — key conversion events only
 *   • Microsoft Clarity            — custom tags for important events
 *
 * Safe to call from any client component. Silently no-ops on the server.
 */

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    fbq: (...args: unknown[]) => void;
    clarity: (command: string, ...args: unknown[]) => void;
  }
}

type TrackParams = Record<string, string | number | boolean | undefined>;

export function track(eventName: string, params?: TrackParams) {
  if (typeof window === "undefined") return;

  // ── Google Analytics 4 ────────────────────────────────────
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params ?? {});
  }

  // ── Meta Pixel — standard event mapping ──────────────────
  if (typeof window.fbq === "function") {
    switch (eventName) {
      case "signup":
        window.fbq("track", "CompleteRegistration", { district: params?.district });
        break;
      case "ticket_purchase_submitted":
        window.fbq("track", "Purchase", { value: params?.price, currency: "BDT" });
        break;
      case "boost_submitted":
        window.fbq("track", "Purchase", { value: params?.amount, currency: "BDT" });
        break;
      case "post_shared":
        window.fbq("track", "Share", { content_type: params?.method });
        break;
      case "post_created":
        window.fbq("track", "SubmitApplication", { content_category: params?.event_type });
        break;
    }
  }

  // ── Microsoft Clarity — tag key moments for session replay ─
  if (typeof window.clarity === "function") {
    switch (eventName) {
      case "ticket_purchase_submitted":
      case "boost_submitted":
      case "org_badge_submitted":
      case "signup":
        window.clarity("set", "conversion", eventName);
        break;
      case "push_opted_in":
        window.clarity("set", "push_notification", "opted_in");
        break;
    }
  }
}

// ─── Typed helpers for key events ────────────────────────────
// These make call sites cleaner and self-documenting.

export const analytics = {
  signup: (district: string) =>
    track("signup", { district }),

  login: (method: "email" | "google") =>
    track("login", { method }),

  postCreated: (eventType: "POST" | "EVENT", district: string) =>
    track("post_created", { event_type: eventType, district }),

  postLiked: (eventId: string) =>
    track("post_liked", { event_id: eventId }),

  postUnliked: (eventId: string) =>
    track("post_unliked", { event_id: eventId }),

  postCommented: (eventId: string) =>
    track("post_commented", { event_id: eventId }),

  postBookmarked: (eventId: string) =>
    track("post_bookmarked", { event_id: eventId }),

  postUnbookmarked: (eventId: string) =>
    track("post_unbookmarked", { event_id: eventId }),

  postShared: (eventId: string, method: "whatsapp" | "facebook" | "native" | "copy_link") =>
    track("post_shared", { event_id: eventId, method }),

  eventAttending: (eventId: string) =>
    track("event_attending", { event_id: eventId }),

  eventNotAttending: (eventId: string) =>
    track("event_not_attending", { event_id: eventId }),

  userFollowed: (targetUserId: string) =>
    track("user_followed", { target_user_id: targetUserId }),

  userUnfollowed: (targetUserId: string) =>
    track("user_unfollowed", { target_user_id: targetUserId }),

  searchPerformed: (queryLength: number) =>
    track("search_performed", { query_length: queryLength }),

  ticketViewed: (eventId: string, price: number) =>
    track("ticket_viewed", { event_id: eventId, price }),

  ticketPurchaseInitiated: (eventId: string, price: number) =>
    track("ticket_purchase_initiated", { event_id: eventId, price }),

  ticketPurchaseSubmitted: (eventId: string, price: number) =>
    track("ticket_purchase_submitted", { event_id: eventId, price }),

  boostInitiated: (eventId: string) =>
    track("boost_initiated", { event_id: eventId }),

  boostSubmitted: (eventId: string, tierDays: number, amount: number) =>
    track("boost_submitted", { event_id: eventId, tier_days: tierDays, amount }),

  orgBadgeInitiated: () =>
    track("org_badge_initiated"),

  orgBadgeSubmitted: () =>
    track("org_badge_submitted"),

  pushPromptShown: () =>
    track("push_prompt_shown"),

  pushOptedIn: () =>
    track("push_opted_in"),

  pushDismissed: () =>
    track("push_dismissed"),

  pwaInstalled: () =>
    track("pwa_installed"),
} as const;
