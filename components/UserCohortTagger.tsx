"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { track } from "@/utils/analytics";

function getSignupCohort(createdAt: string): string {
  const d = new Date(createdAt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getAccountAgeBucket(createdAt: string): string {
  const days = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / 86_400_000
  );
  if (days <= 7) return "new_0-7d";
  if (days <= 30) return "active_8-30d";
  if (days <= 90) return "regular_31-90d";
  return "veteran_90d+";
}

export default function UserCohortTagger() {
  const { data: session } = useSession();
  const taggedRef = useRef(false);

  useEffect(() => {
    if (taggedRef.current || !session?.user) return;

    const { createdAt, stateName, role, isVerifiedOrg } = session.user;

    const cohort = createdAt ? getSignupCohort(createdAt) : undefined;
    const ageBucket = createdAt ? getAccountAgeBucket(createdAt) : undefined;

    // ── GA4 user properties ──
    if (typeof window.gtag === "function") {
      window.gtag("set", "user_properties", {
        signup_cohort: cohort,
        account_age: ageBucket,
        district: stateName,
        user_role: role,
        is_verified_org: isVerifiedOrg,
      });
    }

    // ── Clarity custom tags ──
    if (typeof window.clarity === "function") {
      if (cohort) window.clarity("set", "signup_cohort", cohort);
      if (ageBucket) window.clarity("set", "account_age", ageBucket);
      if (stateName) window.clarity("set", "district", stateName);
      if (role) window.clarity("set", "user_role", role);
      if (isVerifiedOrg) window.clarity("set", "verified_org", "true");
    }

    // Fire a one-time identify event for GA4
    track("user_identified", {
      signup_cohort: cohort,
      account_age: ageBucket,
      district: stateName,
      user_role: role,
      is_verified_org: isVerifiedOrg,
    });

    taggedRef.current = true;
  }, [session]);

  return null;
}
