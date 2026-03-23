import { useSession } from "next-auth/react";
import { useCallback } from "react";
import { analytics } from "@/utils/analytics";

const STORAGE_KEY = "shadhin_first_action";

/**
 * Returns a function `markFirstAction(actionName)` that fires
 * `analytics.timeToFirstAction` exactly once per user account.
 * Call it from any component that represents a meaningful first action
 * (post, like, comment, attend).
 */
export function useFirstAction() {
  const { data: session } = useSession();

  return useCallback(
    (action: string) => {
      if (typeof window === "undefined") return;
      if (!session?.user?.createdAt) return;

      const userId = session.user.id;
      if (!userId) return;

      const key = `${STORAGE_KEY}_${userId}`;
      if (localStorage.getItem(key)) return; // already fired

      const secondsSinceSignup = Math.round(
        (Date.now() - new Date(session.user.createdAt).getTime()) / 1000
      );

      analytics.timeToFirstAction(action, secondsSinceSignup);
      localStorage.setItem(key, action);
    },
    [session]
  );
}
