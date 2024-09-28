"use client";
import React, { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import UploadCard from "./UploadCard";
import EventCard, { EventWithUser } from "../Shared/EventCard";
import ClipLoader from "react-spinners/ClipLoader";
import { deleteEventByUser, fetchEvents } from "@/actions/event";
import { like } from "@/actions/like";
import { markAsAttending, markAsNotAttending } from "@/actions/event-attend";
import { useSocket } from "@/context/SocketProvider";
import { useCurrentUser } from "@/hooks/use-current-user";
import { EventStatus } from "@prisma/client";

type FeedSectionProps = {
  activeState: string;
  initialEvents: EventWithUser[];
};

const FeedSection = ({ activeState, initialEvents }: FeedSectionProps) => {
  const { sendNotification } = useSocket();
  const user = useCurrentUser();

  const [events, setEvents] = React.useState<EventWithUser[]>(
    initialEvents || []
  );
  const [page, setPage] = React.useState<number>(1);
  const [hasMore, setHasMore] = React.useState<boolean>(true);
  const [ref, inView] = useInView();

  const fetchMoreEvents = async () => {
    const newEvents = await fetchEvents(activeState, page + 1);
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
    <section className="flex-[2.5] flex flex-col gap-3">
      <UploadCard />
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
          No events found for{" "}
          <span className="text-gray-800 font-semibold capitalize">
            {activeState}
          </span>
        </p>
      )}
      {hasMore && (
        <div ref={ref} className="flex items-center justify-center my-4">
          <ClipLoader color="#16a34a" size={30} />
        </div>
      )}
    </section>
  );
};

export default FeedSection;
