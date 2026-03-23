"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { EventStatus } from "@prisma/client";

import UploadCard from "./UploadCard";
import EventCard, { EventWithUser } from "../Shared/EventCard";
import { EventCardSkeleton } from "../Shared/EventCardSkeleton";
import { deleteEventByUser, fetchEvents } from "@/actions/event";
import { like } from "@/actions/like";
import { markAsAttending, markAsNotAttending } from "@/actions/event-attend";
import { addNotification } from "@/actions/notification";
import { getUserBookmarkIds } from "@/actions/bookmark";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useScrollDepth } from "@/hooks/use-scroll-depth";

// Number of skeleton cards to show while loading next page
const SKELETON_COUNT = 3;

type FeedSectionProps = {
  activeState: string;
  initialEvents: EventWithUser[];
};

const FeedSection = ({ activeState, initialEvents }: FeedSectionProps) => {
  const user = useCurrentUser();
  useScrollDepth(activeState);

  const [events, setEvents] = React.useState<EventWithUser[]>(
    initialEvents || []
  );
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [bookmarkIds, setBookmarkIds] = React.useState<Set<string>>(new Set());

  // Ref-based guard prevents race conditions without triggering extra renders.
  // State-based isLoading is only used for the skeleton UI.
  const isLoadingRef = useRef(false);

  // Trigger 400px before the sentinel enters the viewport for a smooth,
  // seamless experience — new events are ready before the user notices the end.
  const [ref, inView] = useInView({
    threshold: 0,
    rootMargin: "0px 0px 400px 0px",
  });

  // Reset the entire feed when the user switches districts
  useEffect(() => {
    setEvents(initialEvents || []);
    setPage(1);
    setHasMore(true);
    setIsLoading(false);
    isLoadingRef.current = false;
  }, [activeState, initialEvents]);

  useEffect(() => {
    getUserBookmarkIds().then((ids) => setBookmarkIds(new Set(ids)));
  }, []);

  const fetchMoreEvents = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) return;

    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      const newEvents = await fetchEvents(activeState, page + 1);

      if (newEvents?.length) {
        setPage((p) => p + 1);
        setEvents((prev) => {
          // Deduplicate — ranked feed pagination can produce overlapping results
          // when new posts arrive between page fetches.
          const existingIds = new Set(prev.map((e) => e.id));
          const unique = newEvents.filter((e) => !existingIds.has(e.id));
          return [...prev, ...unique];
        });
      } else {
        setHasMore(false);
      }
    } catch {
      toast.error("Couldn't load more posts. Please try again.");
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [activeState, page, hasMore]);

  useEffect(() => {
    if (inView && !isLoadingRef.current) {
      fetchMoreEvents();
    }
  }, [inView, fetchMoreEvents]);

  // ── Optimistic handlers ───────────────────────────────────────────────────

  const likeEventHandler = async (eventId: string, eventUserId: string) => {
    const updatedEvents = events.map((event) => {
      if (event.id !== eventId) return event;
      const newLikes = event.isLikedByUser
        ? event.likes.filter((l) => l.userId !== user?.id)
        : [...event.likes, { id: user?.id!, userId: user?.id! }];
      return { ...event, isLikedByUser: !event.isLikedByUser, likes: newLikes };
    });
    setEvents(updatedEvents);

    const res = await like(eventId);
    if (res.error) {
      toast.error(res.error);
      setEvents(events);
      return;
    }
    const updated = updatedEvents.find((e) => e.id === eventId);
    if (updated?.isLikedByUser) {
      addNotification(`${user?.name}: Liked your event`, eventId, eventUserId);
    }
  };

  const attendEventHandler = async (eventId: string, eventUserId: string) => {
    const updatedEvents = events.map((event) => {
      if (event.id !== eventId) return event;
      const newAttendees = event.isUserAttending
        ? event.attendees.filter((a) => a.userId !== user?.id)
        : [
            ...event.attendees,
            { id: user?.id!, userId: user?.id!, status: EventStatus.GOING },
          ];
      return {
        ...event,
        isUserAttending: !event.isUserAttending,
        isUserNotAttending: false,
        attendees: newAttendees,
      };
    });
    setEvents(updatedEvents);

    const res = await markAsAttending(eventId);
    if (res.error) {
      toast.error(res.error);
      setEvents(events);
      return;
    }
    const updated = updatedEvents.find((e) => e.id === eventId);
    if (updated?.isUserAttending) {
      addNotification(
        `${user?.name}: Attending your event`,
        eventId,
        eventUserId
      );
    }
  };

  const notAttendEventHandler = async (
    eventId: string,
    eventUserId: string
  ) => {
    const updatedEvents = events.map((event) => {
      if (event.id !== eventId) return event;
      return {
        ...event,
        isUserNotAttending: !event.isUserNotAttending,
        isUserAttending: false,
        attendees: event.attendees.filter((a) => a.userId !== user?.id),
      };
    });
    setEvents(updatedEvents);

    const res = await markAsNotAttending(eventId);
    if (res.error) {
      toast.error(res.error);
      setEvents(events);
      return;
    }
    const updated = updatedEvents.find((e) => e.id === eventId);
    if (updated?.isUserNotAttending) {
      addNotification(
        `${user?.name}: Not attending your event`,
        eventId,
        eventUserId
      );
    }
  };

  const onDeleteEvent = async (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    await deleteEventByUser(eventId);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <UploadCard />

      <div className="divide-y divide-border/50">
        {events.length > 0 ? (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              initialBookmarked={bookmarkIds.has(event.id)}
              eventLikeHandler={() => likeEventHandler(event.id, event.user.id)}
              eventAttendHandler={() =>
                attendEventHandler(event.id, event.user.id)
              }
              eventNotAttendHandler={() =>
                notAttendEventHandler(event.id, event.user.id)
              }
              onDeleteEvent={() => onDeleteEvent(event.id)}
            />
          ))
        ) : !isLoading ? (
          <p className="text-center text-sm text-muted-foreground py-10">
            No events found for{" "}
            <span className="font-semibold text-foreground capitalize">
              {activeState}
            </span>
          </p>
        ) : null}
      </div>

      {/* Sentinel + skeleton cards while fetching next page */}
      {hasMore && (
        <div ref={ref}>
          {isLoading && (
            <div className="divide-y divide-border/50 border-t border-border/50">
              {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* End-of-feed message */}
      {!hasMore && events.length > 0 && (
        <div className="flex items-center justify-center gap-2 py-8 border-t border-border/50">
          <CheckCircle2 size={16} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">You&apos;re all caught up</p>
        </div>
      )}
    </section>
  );
};

export default FeedSection;
