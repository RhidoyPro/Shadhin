"use client";

import { useEffect, useRef, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { analytics } from "@/utils/analytics";

export function useContentViewTracking(eventId: string) {
  const startTimeRef = useRef<number | null>(null);
  const totalTimeRef = useRef(0);
  const reportedRef = useRef(false);

  const { ref, inView } = useInView({ threshold: 0.5 });

  useEffect(() => {
    if (inView) {
      startTimeRef.current = Date.now();
    } else if (startTimeRef.current) {
      totalTimeRef.current += (Date.now() - startTimeRef.current) / 1000;
      startTimeRef.current = null;
    }
  }, [inView]);

  const report = useCallback(() => {
    if (reportedRef.current) return;
    let total = totalTimeRef.current;
    if (startTimeRef.current) {
      total += (Date.now() - startTimeRef.current) / 1000;
    }
    // Only report if viewed for at least 2 seconds
    if (total >= 2) {
      analytics.contentViewDuration(eventId, total, 0);
      reportedRef.current = true;
    }
  }, [eventId]);

  useEffect(() => {
    window.addEventListener("beforeunload", report);
    return () => {
      report();
      window.removeEventListener("beforeunload", report);
    };
  }, [report]);

  return { ref };
}
