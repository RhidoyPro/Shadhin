"use client";

import { useEffect } from "react";
import { onCLS, onINP, onLCP, onFCP, onTTFB } from "web-vitals";
import { analytics } from "@/utils/analytics";

function getConnectionType(): string | undefined {
  const nav = navigator as Navigator & {
    connection?: { effectiveType?: string };
  };
  return nav.connection?.effectiveType;
}

export default function WebVitalsTracker() {
  useEffect(() => {
    const conn = getConnectionType();
    const report = (name: string, value: number) =>
      analytics.webVital(name, value, conn);

    onCLS((m) => report("CLS", m.value * 1000)); // scale CLS to ms-like for consistency
    onINP((m) => report("INP", m.value));
    onLCP((m) => report("LCP", m.value));
    onFCP((m) => report("FCP", m.value));
    onTTFB((m) => report("TTFB", m.value));
  }, []);

  return null;
}
