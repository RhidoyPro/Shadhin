"use client";

import { useEffect, useRef } from "react";
import { analytics } from "@/utils/analytics";

const THRESHOLDS = [25, 50, 75, 100];

export function useScrollDepth(pageName: string) {
  const firedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    firedRef.current = new Set();
  }, [pageName]);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight <= 0) { ticking = false; return; }

        const pct = Math.round((scrollTop / docHeight) * 100);

        for (const threshold of THRESHOLDS) {
          if (pct >= threshold && !firedRef.current.has(threshold)) {
            firedRef.current.add(threshold);
            analytics.scrollDepth(pageName, threshold);
          }
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pageName]);
}
