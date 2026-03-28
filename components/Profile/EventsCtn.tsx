"use client";
import React, { useCallback, useEffect, useState } from "react";
import EventCard, { EventWithUser } from "@/components/Shared/EventCard";
import { useInView } from "react-intersection-observer";
import { deleteEventByUser, fetchUserEvents } from "@/actions/event";
import ClipLoader from "react-spinners/ClipLoader";
import { markAsAttending, markAsNotAttending } from "@/actions/event-attend";
import { like } from "@/actions/like";
import { addNotification } from "@/actions/notification";
import { getUserBookmarkIds } from "@/actions/bookmark";
import { useCurrentUser } from "@/hooks/use-current-user";
import { EventStatus } from "@prisma/client";
import { toast } from "sonner";

interface EventsCtnProps {
  initialEvents: EventWithUser[];
  username: string;
  userId: string;
}

const EventsCtn = ({ initialEvents, username, userId }: EventsCtnProps) => {
  const user = useCurrentUser();

  const [events, setEvents] = useState<EventWithUser[]>(initialEvents || []);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [bookmarkIds, setBookmarkIds] = useState<Set<string>>(new Set());
  const [ref, inView] = useInView();

  useEffect(() => {
    getUserBookmarkIds().then((ids) => setBookmarkIds(new Set(ids)));
  }, []);

  const fetchMoreEvents = useCallback(async () => {
    const newEvents = await fetchUserEvents(userId, page + 1);
    if (newEvents?.length) {
      setPage((p) => p + 1);
      setEvents((prev) => [...prev, ...newEvents]);
      return;
    }
    setHasMore(false);
  }, [userId, page]);

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

    const attendRes = await markAsAttending(eventId);
    if (attendRes.error) {
      toast.error(attendRes.error);
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

    const notAttendRes = await markAsNotAttending(eventId);
    if (notAttendRes.error) {
      toast.error(notAttendRes.error);
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
    <>
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
        <p className="text-center text-lg text-gray-600 dark:text-gray-300 mt-4">
          There are no events for{" "}
          <span className="text-gray-800 dark:text-white font-semibold capitalize">
            {username}
          </span>
        </p>
      )}
      {hasMore && (
        <div ref={ref} className="flex items-center justify-center my-4">
          <ClipLoader color="#16a34a" size={30} />
        </div>
      )}
    </>
  );
};

export default EventsCtn;
