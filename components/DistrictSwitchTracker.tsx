"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { analytics } from "@/utils/analytics";

const DISTRICT_PATTERN = /^\/events\/([^/]+)/;

export default function DistrictSwitchTracker() {
  const pathname = usePathname();
  const prevDistrictRef = useRef<string | null>(null);

  useEffect(() => {
    const match = pathname.match(DISTRICT_PATTERN);
    if (!match) return;

    const currentDistrict = match[1];
    if (
      prevDistrictRef.current &&
      prevDistrictRef.current !== currentDistrict
    ) {
      analytics.districtSwitch(prevDistrictRef.current, currentDistrict);
    }
    prevDistrictRef.current = currentDistrict;
  }, [pathname]);

  return null;
}
