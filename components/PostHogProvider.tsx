"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

// Window.__posthog type declared in utils/analytics.ts

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

export default function PostHogProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!POSTHOG_KEY) return;

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false, // manual via route changes
      capture_pageleave: true,
      autocapture: true,
      persistence: "localStorage", // avoid extra cookies
    });

    window.__posthog = posthog;
  }, []);

  // Track pageviews on route changes
  useEffect(() => {
    if (!window.__posthog) return;
    let url = window.origin + pathname;
    if (searchParams.toString()) url += `?${searchParams.toString()}`;
    window.__posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}
