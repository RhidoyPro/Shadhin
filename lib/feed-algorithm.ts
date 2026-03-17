/**
 * Feed ranking algorithm for Shadhin.io
 *
 * Score = (likes × 1) + (comments × 2) + (shares/attendees × 3)
 *         ÷ (hours_since_posted ^ 1.5)
 *         × (same_district_bonus × 2)
 *         × (following_bonus × 1.5)
 */

// ── Config (tune these without touching scoring logic) ─────────────────────
export const FEED_CONFIG = {
  likeWeight: 1,
  commentWeight: 2,
  attendeeWeight: 3,
  timeDecayExponent: 1.5,
  sameDistrictMultiplier: 2,
  followingMultiplier: 1.5,
  // How many raw events to fetch before ranking (fetch more, rank, then page)
  fetchMultiplier: 3,
} as const;

// ── Types ──────────────────────────────────────────────────────────────────
export interface RankableEvent {
  id: string;
  userId: string;
  stateName: string;
  createdAt: Date;
  likes: { id: string }[];
  comments: { id: string }[];
  attendees: { id: string }[];
}

export interface ViewerContext {
  /** IDs of users the viewer follows */
  followingUserIds: Set<string>;
  /** The viewer's own state */
  viewerStateName: string | null;
}

// ── Scoring ────────────────────────────────────────────────────────────────
function scoreEvent(event: RankableEvent, ctx: ViewerContext): number {
  const hoursAgo = Math.max(
    (Date.now() - event.createdAt.getTime()) / (1000 * 60 * 60),
    0.1 // Prevent division by zero for very new posts
  );

  const { likeWeight, commentWeight, attendeeWeight, timeDecayExponent, sameDistrictMultiplier, followingMultiplier } = FEED_CONFIG;

  // Engagement: (likes × 1) + (comments × 2) + (attendees × 3)
  const engagement =
    event.likes.length * likeWeight +
    event.comments.length * commentWeight +
    event.attendees.length * attendeeWeight;

  // Time decay: ÷ (hours ^ 1.5)
  const timeDecay = Math.pow(hoursAgo, timeDecayExponent);
  let score = engagement / timeDecay;

  // Same district bonus: × 2
  if (ctx.viewerStateName && event.stateName === ctx.viewerStateName) {
    score *= sameDistrictMultiplier;
  }

  // Following bonus: × 1.5
  if (ctx.followingUserIds.has(event.userId)) {
    score *= followingMultiplier;
  }

  return score;
}

/**
 * Rank a list of events for a given viewer context.
 * Returns events sorted by descending score.
 */
export function rankEvents<T extends RankableEvent>(
  events: T[],
  ctx: ViewerContext
): T[] {
  return [...events].sort(
    (a, b) => scoreEvent(b, ctx) - scoreEvent(a, ctx)
  );
}

/**
 * Build a ViewerContext from the viewer's follow list and state.
 * Pass null/undefined userId to get a context that falls back to
 * chronological order (all multipliers are 1).
 */
export function buildViewerContext(
  userId: string | undefined | null,
  interactions: {
    followingUserIds: string[];
    stateName: string | null;
  }
): ViewerContext {
  if (!userId) {
    return {
      followingUserIds: new Set(),
      viewerStateName: null,
    };
  }

  return {
    followingUserIds: new Set(interactions.followingUserIds),
    viewerStateName: interactions.stateName,
  };
}
