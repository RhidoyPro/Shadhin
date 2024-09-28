"use client";
import React, { useEffect, useState } from "react";
import EventCard, { EventWithUser } from "../Shared/EventCard";
import { like } from "@/actions/like";
import { markAsAttending, markAsNotAttending } from "@/actions/event-attend";
import { useSocket } from "@/context/SocketProvider";
import { useCurrentUser } from "@/hooks/use-current-user";
import { EventStatus } from "@prisma/client";
import { deleteEventByUser } from "@/actions/event";
import { useRouter } from "next/navigation";

interface IEventData {
  event: EventWithUser;
}

const EventData = ({ event: initialEvent }: IEventData) => {
  const router = useRouter();
  const [event, setEvent] = useState<EventWithUser>(initialEvent);
  const { sendNotification } = useSocket();
  const user = useCurrentUser();

  const likeEventHandler = async (eventId: string, eventUserId: string) => {
    const wasLiked = event.isLikedByUser;
    setEvent((prevEvent) => ({
      ...prevEvent,
      isLikedByUser: !prevEvent.isLikedByUser,
      likes: prevEvent.isLikedByUser
        ? prevEvent.likes.filter((like) => like.userId !== user?.id!)
        : [...prevEvent.likes, { id: user?.id!, userId: user?.id! }],
    }));

    await like(eventId);
    if (!wasLiked) sendNotification(`Liked your event`, eventUserId, eventId);
  };

  const attendEventHandler = async (eventId: string, eventUserId: string) => {
    setEvent((prevEvent) => {
      const newAttendees = prevEvent.isUserAttending
        ? prevEvent.attendees.filter(
            (attendee) => attendee.userId !== user?.id!
          )
        : [
            ...prevEvent.attendees,
            { id: user?.id!, userId: user?.id!, status: EventStatus.GOING },
          ];

      return {
        ...prevEvent,
        isUserAttending: !prevEvent.isUserAttending,
        isUserNotAttending: false, // Ensure not attending is set to false
        attendees: newAttendees,
      };
    });

    await markAsAttending(eventId);
    if (!event.isUserAttending) {
      sendNotification(`Attending your event`, eventUserId, eventId);
    }
  };

  const notAttendEventHandler = async (
    eventId: string,
    eventUserId: string
  ) => {
    setEvent((prevEvent) => ({
      ...prevEvent,
      isUserNotAttending: !prevEvent.isUserNotAttending,
      isUserAttending: false, // Ensure attending is set to false
      attendees: prevEvent.attendees.filter(
        (attendee) => attendee.userId !== user?.id!
      ),
    }));

    await markAsNotAttending(eventId);
    if (!event.isUserNotAttending) {
      sendNotification(`Not attending your event`, eventUserId, eventId);
    }
  };

  useEffect(() => {
    setEvent(initialEvent);
  }, [initialEvent]);

  const onDeleteEvent = async () => {
    deleteEventByUser(event.id);
    router.push(`/user/${event.user.id}`);
  };

  return (
    <EventCard
      showFullContent
      event={event}
      eventLikeHandler={() => likeEventHandler(event.id, event.user.id)}
      eventAttendHandler={() => attendEventHandler(event.id, event.user.id)}
      eventNotAttendHandler={() =>
        notAttendEventHandler(event.id, event.user.id)
      }
      onDeleteEvent={onDeleteEvent}
    />
  );
};

export default EventData;
