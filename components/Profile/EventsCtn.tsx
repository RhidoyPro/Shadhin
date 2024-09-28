"use client";
import React, { useEffect, useState } from "react";
import EventCard, { EventWithUser } from "@/components/Shared/EventCard";
import { useInView } from "react-intersection-observer";
import { deleteEventByUser, fetchUserEvents } from "@/actions/event";
import ClipLoader from "react-spinners/ClipLoader";
import { markAsAttending, markAsNotAttending } from "@/actions/event-attend";
import { like } from "@/actions/like";
import { useSocket } from "@/context/SocketProvider";
import { useCurrentUser } from "@/hooks/use-current-user";
import { EventStatus } from "@prisma/client";

interface EventsCtnProps {
  initialEvents: EventWithUser[];
  username: string;
  userId: string;
}

const EventsCtn = ({ initialEvents, username, userId }: EventsCtnProps) => {
  const { sendNotification } = useSocket();
  const user = useCurrentUser();

  const [events, setEvents] = useState<EventWithUser[]>(initialEvents || []);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [ref, inView] = useInView();

  const fetchMoreEvents = async () => {
    const newEvents = await fetchUserEvents(userId, page + 1);
    if (newEvents?.length) {
      setPage(page + 1);
      setEvents([...events, ...newEvents]);
      return;
    }
    setHasMore(false);
  };

  useEffect(() => {
    if (inView) {
      fetchMoreEvents();
    }
  }, [inView]);

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

    await like(eventId);
    const updatedEvent = updatedEvents.find((e) => e.id === eventId);
    // send notification if the event is liked by the user
    if (updatedEvent && updatedEvent.isLikedByUser) {
      sendNotification(`Liked your event`, eventUserId, eventId);
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

    await markAsAttending(eventId);
    const updatedEvent = updatedEvents.find((e) => e.id === eventId);
    if (updatedEvent && updatedEvent.isUserAttending) {
      sendNotification(`Attending your event`, eventUserId, eventId);
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

    await markAsNotAttending(eventId);
    const updatedEvent = updatedEvents.find((e) => e.id === eventId);
    if (updatedEvent && updatedEvent.isUserNotAttending) {
      sendNotification(`Not attending your event`, eventUserId, eventId);
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
        <p className="text-center text-lg text-gray-600 mt-4">
          There are no events for{" "}
          <span className="text-gray-800 font-semibold capitalize">
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
