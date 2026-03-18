"use client";
import React, { useCallback, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import UploadCard from "./UploadCard";
import EventCard, { EventWithUser } from "../Shared/EventCard";
import ClipLoader from "react-spinners/ClipLoader";
import { deleteEventByUser, fetchEvents } from "@/actions/event";
import { like } from "@/actions/like";
import { markAsAttending, markAsNotAttending } from "@/actions/event-attend";
import { addNotification } from "@/actions/notification";
import { getUserBookmarkIds } from "@/actions/bookmark";
import { useCurrentUser } from "@/hooks/use-current-user";
import { EventStatus } from "@prisma/client";
import { toast } from "sonner";

type FeedSectionProps = {
  activeState: string;
  initialEvents: EventWithUser[];
};

const FeedSection = ({ activeState, initialEvents }: FeedSectionProps) => {
  const user = useCurrentUser();

  const [events, setEvents] = React.useState<EventWithUser[]>(
    initialEvents || []
  );
  const [page, setPage] = React.useState<number>(1);
  const [hasMore, setHasMore] = React.useState<boolean>(true);
  const [bookmarkIds, setBookmarkIds] = React.useState<Set<string>>(new Set());
  const [ref, inView] = useInView();

  useEffect(() => {
    getUserBookmarkIds().then((ids) => setBookmarkIds(new Set(ids)));
  }, []);

  const fetchMoreEvents = useCallback(async () => {
    const newEvents = await fetchEvents(activeState, page + 1);
    if (newEvents?.length) {
      setPage((p) => p + 1);
      setEvents((prev) => [...prev, ...newEvents]);
      return;
    }
    setHasMore(false);
  }, [activeState, page]);

  useEffect(() => {
    if (inView) {
      fetchMoreEvents();
    }
  }, [inView, fetchMoreEvents]);

  const likeEventHandler = async (eventId: string, eventUserId: string) => {
    const updatedEvents = events.map((event) => {
      if (event.id === eventId) {
        const newLikes = event.isLikedByUser
          ? event.likes.filter((like) => like.userId !== user?.id!)
          : [...event.likes, { id: user?.id!, userId: user?.id! }];
        return {
          ...event,
          isLikedByUser: !event.isLikedByUser,
          likes: newLikes,
        };
      }
      return event;
    });
    setEvents(updatedEvents);

    const res = await like(eventId);
    if (res.error) {
      toast.error(res.error);
      setEvents(events); // revert
      return;
    }
    const updatedEvent = updatedEvents.find((e) => e.id === eventId);
    if (updatedEvent && updatedEvent.isLikedByUser) {
      addNotification(`${user?.name}: Liked your event`, eventId, eventUserId);
    }
  };

  const attendEventHandler = async (eventId: string, eventUserId: string) => {
    const updatedEvents = events.map((event) => {
      if (event.id === eventId) {
        const newAttendees = event.isUserAttending
          ? event.attendees.filter((attendee) => attendee.userId !== user?.id!)
          : [
              ...event.attendees,
              { id: user?.id!, userId: user?.id!, status: EventStatus.GOING },
            ];
        return {
          ...event,
          isUserAttending: !event.isUserAttending,
          isUserNotAttending: false, // Ensure not attending is set to false
          attendees: newAttendees,
        };
      }
      return event;
    });
    setEvents(updatedEvents);

    const res = await markAsAttending(eventId);
    if (res.error) {
      toast.error(res.error);
      setEvents(events); // revert
      return;
    }
    const updatedEvent = updatedEvents.find((e) => e.id === eventId);
    if (updatedEvent && updatedEvent.isUserAttending) {
      addNotification(`${user?.name}: Attending your event`, eventId, eventUserId);
    }
  };

  const notAttendEventHandler = async (
    eventId: string,
    eventUserId: string
  ) => {
    const updatedEvents = events.map((event) => {
      if (event.id === eventId) {
        return {
          ...event,
          isUserNotAttending: !event.isUserNotAttending,
          isUserAttending: false, // Ensure attending is set to false
          attendees: event.attendees.filter(
            (attendee) => attendee.userId !== user?.id!
          ),
        };
      }
      return event;
    });
    setEvents(updatedEvents);

    const res = await markAsNotAttending(eventId);
    if (res.error) {
      toast.error(res.error);
      setEvents(events); // revert
      return;
    }
    const updatedEvent = updatedEvents.find((e) => e.id === eventId);
    if (updatedEvent && updatedEvent.isUserNotAttending) {
      addNotification(`${user?.name}: Not attending your event`, eventId, eventUserId);
    }
  };

  const onDeleteEvent = async (eventId: string) => {
    setEvents(events.filter((event) => event.id !== eventId));
    await deleteEventByUser(eventId);
  };

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <UploadCard />
      <div className="divide-y divide-border/50">
        {events?.length ? (
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
        ) : (
          <p className="text-center text-sm text-muted-foreground py-10">
            No events found for{" "}
            <span className="font-semibold text-foreground capitalize">
              {activeState}
            </span>
          </p>
        )}
      </div>
      {hasMore && (
        <div ref={ref} className="flex items-center justify-center py-6 border-t border-border/50">
          <ClipLoader color="#16a34a" size={24} />
        </div>
      )}
    </section>
  );
};

export default FeedSection;
