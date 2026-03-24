"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { analytics } from "@/utils/analytics";

const SESSION_KEY = "shadhin_session_depth";
const LAST_VISIT_KEY = "shadhin_last_visit";

export default function SessionDepthTracker() {
  const pathname = usePathname();
  const startTimeRef = useRef(Date.now());

  // Increment page count on each route change
  useEffect(() => {
    const current = parseInt(sessionStorage.getItem(SESSION_KEY) || "0", 10);
    sessionStorage.setItem(SESSION_KEY, String(current + 1));
  }, [pathname]);

  // Report on page unload
  useEffect(() => {
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    const isReturning = !!lastVisit;

    const report = () => {
      const pageCount = parseInt(
        sessionStorage.getItem(SESSION_KEY) || "1",
        10
      );
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      analytics.sessionDepth(pageCount, duration, isReturning);

      // Update last visit timestamp
      localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") report();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", report);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", report);
    };
  }, []);

  return null;
}
