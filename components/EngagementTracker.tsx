"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/utils/analytics";

const HEARTBEAT_MS = 5000;

export default function EngagementTracker() {
  const pathname = usePathname();
  const secondsRef = useRef(0);
  const visibleRef = useRef(true);
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    // Flush previous page engagement on route change
    if (pathnameRef.current !== pathname && secondsRef.current > 0) {
      sendEngagement(pathnameRef.current, secondsRef.current);
      secondsRef.current = 0;
    }
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const tick = setInterval(() => {
      if (visibleRef.current) {
        secondsRef.current += HEARTBEAT_MS / 1000;
      }
    }, HEARTBEAT_MS);

    const onVisChange = () => {
      if (document.visibilityState === "hidden") {
        visibleRef.current = false;
        if (secondsRef.current > 0) {
          sendEngagement(pathnameRef.current, secondsRef.current);
        }
      } else {
        visibleRef.current = true;
      }
    };

    const onBeforeUnload = () => {
      if (secondsRef.current > 0) {
        sendEngagement(pathnameRef.current, secondsRef.current);
      }
    };

    document.addEventListener("visibilitychange", onVisChange);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);

  return null;
}

function sendEngagement(page: string, seconds: number) {
  const rounded = Math.round(seconds);
  if (rounded < 3) return; // Ignore very short sessions

  // Use sendBeacon-compatible approach for reliable delivery on exit
  if (typeof window.gtag === "function") {
    window.gtag("event", "engagement_time", {
      seconds: rounded,
      page,
      transport_type: "beacon",
    });
  }

  if (typeof window.clarity === "function") {
    const bucket = rounded < 30 ? "0-30s" : rounded < 120 ? "30-120s" : "120s+";
    window.clarity("set", "engagement", bucket);
  }
}
