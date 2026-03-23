import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { analytics } from "@/utils/analytics";

/**
 * Client-side hook to evaluate a feature flag.
 * Calls the API route and caches the result in sessionStorage.
 * Fires an experiment_exposure event on first evaluation.
 *
 * Usage:
 *   const variant = useFeatureFlag("new_feed_layout");
 *   if (variant === "treatment") { ... }
 */
export function useFeatureFlag(
  flagKey: string
): "control" | "treatment" | "loading" {
  const { data: session } = useSession();
  const [variant, setVariant] = useState<
    "control" | "treatment" | "loading"
  >("loading");

  useEffect(() => {
    if (!session?.user?.id) {
      setVariant("control");
      return;
    }

    const cacheKey = `ff_${flagKey}_${session.user.id}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached === "control" || cached === "treatment") {
      setVariant(cached);
      return;
    }

    fetch(`/api/feature-flag?key=${flagKey}`)
      .then((r) => r.json())
      .then((data) => {
        const v = data.variant as "control" | "treatment";
        setVariant(v);
        sessionStorage.setItem(cacheKey, v);
        if (data.enabled) {
          analytics.experimentExposure(flagKey, v);
        }
      })
      .catch(() => setVariant("control"));
  }, [flagKey, session?.user?.id]);

  return variant;
}
