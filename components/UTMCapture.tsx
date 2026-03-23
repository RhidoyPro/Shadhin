"use client";

import { useEffect } from "react";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
const STORAGE_KEY = "shadhin_utm";

export default function UTMCapture() {
  useEffect(() => {
    // Only capture on first landing — don't overwrite if already set
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};

    for (const key of UTM_KEYS) {
      const val = params.get(key);
      if (val) utm[key] = val;
    }

    // Capture share attribution (?ref=share&method=whatsapp)
    const ref = params.get("ref");
    if (ref) utm.ref = ref;
    const method = params.get("method");
    if (method) utm.share_method = method;

    // Capture referrer (Facebook, WhatsApp, Google, etc.)
    if (document.referrer) {
      try {
        utm.referrer = new URL(document.referrer).hostname;
      } catch {
        utm.referrer = document.referrer;
      }
    }

    if (Object.keys(utm).length > 0) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utm));
    }
  }, []);

  return null;
}
