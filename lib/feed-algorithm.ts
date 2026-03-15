/**
 * Feed ranking algorithm for Shadhin.io
 *
 * Weighted scoring model:
 *   Engagement  40%  — likes + comments + attendances, time-decayed
 *   Social      30%  — events from creators the viewer has interacted with
 *   Interest    20%  — events from states/creators the viewer engages with
 *   Location    10%  — boost for events matching viewer's own state
 */

// ── Config (tune these without touching scoring logic) ─────────────────────
export const FEED_CONFIG = {
  weights: {
    engagement: 0.4,
    social: 0.3,
    interest: 0.2,
    location: 0.1,
  },
  // Engagement decay: score halves every ~7 hours at default 0.1
  decayFactor: 0.1,
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
  /** IDs of users whose posts the viewer has liked/commented/attended */
  socialUserIds: Set<string>;
  /** States the viewer has interacted with */
  interactedStates: Set<string>;
  /** The viewer's own state */
  viewerStateName: string | null;
}

// ── Scoring ────────────────────────────────────────────────────────────────
function scoreEvent(event: RankableEvent, ctx: ViewerContext): number {
  const hoursAgo =
    (Date.now() - event.createdAt.getTime()) / (1000 * 60 * 60);

  // Engagement signal — weighted interactions with time decay
  const rawEngagement =
    event.likes.length * 1 +
    event.comments.length * 2 +
    event.attendees.length * 3;
  const engagement = rawEngagement / (1 + hoursAgo * FEED_CONFIG.decayFactor);

  // Social signal — is the creator someone the viewer interacts with?
  const social = ctx.socialUserIds.has(event.userId) ? 1 : 0;

  // Interest signal — has the viewer engaged in this state before?
  const interest = ctx.interactedStates.has(event.stateName) ? 1 : 0;

  // Location signal — does the event match the viewer's state?
  const location = event.stateName === ctx.viewerStateName ? 1 : 0;

  const { weights } = FEED_CONFIG;
  return (
    engagement * weights.engagement +
    social * weights.social +
    interest * weights.interest +
    location * weights.location
  );
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
 * Build a ViewerContext from the viewer's interaction history.
 * Pass null/undefined userId to get a context that falls back to
 * chronological order (all signals return 0).
 */
export function buildViewerContext(
  userId: string | undefined | null,
  interactions: {
    likedUserIds: string[];
    commentedUserIds: string[];
    attendedUserIds: string[];
    interactedStates: string[];
    stateName: string | null;
  }
): ViewerContext {
  if (!userId) {
    return {
      socialUserIds: new Set(),
      interactedStates: new Set(),
      viewerStateName: null,
    };
  }

  return {
    socialUserIds: new Set([
      ...interactions.likedUserIds,
      ...interactions.commentedUserIds,
      ...interactions.attendedUserIds,
    ]),
    interactedStates: new Set(interactions.interactedStates),
    viewerStateName: interactions.stateName,
  };
}
