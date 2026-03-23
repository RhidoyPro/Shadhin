"use client";

import { useEffect } from "react";
import { analytics } from "@/utils/analytics";

export default function PWAInstallTracker() {
  useEffect(() => {
    const handler = () => analytics.pwaInstalled();
    window.addEventListener("appinstalled", handler);
    return () => window.removeEventListener("appinstalled", handler);
  }, []);

  return null;
}
