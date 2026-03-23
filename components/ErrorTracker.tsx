"use client";

import { useEffect } from "react";
import { track } from "@/utils/analytics";

export default function ErrorTracker() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      track("client_error", {
        message: (e.message || "Unknown error").slice(0, 150),
        source: e.filename ? `${e.filename}:${e.lineno}` : "unknown",
        fatal: false,
      });
      if (typeof window.clarity === "function") {
        window.clarity("set", "error", (e.message || "").slice(0, 100));
      }
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      const msg = e.reason?.message || String(e.reason) || "Unhandled rejection";
      track("client_error", {
        message: msg.slice(0, 150),
        source: "unhandled_rejection",
        fatal: true,
      });
      if (typeof window.clarity === "function") {
        window.clarity("set", "error", msg.slice(0, 100));
      }
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
