"use client";
import React, { useEffect, useState } from "react";
import EventCard, { EventWithUser } from "../Shared/EventCard";
import { like } from "@/actions/like";
import { markAsAttending, markAsNotAttending } from "@/actions/event-attend";
import { addNotification } from "@/actions/notification";
import { useCurrentUser } from "@/hooks/use-current-user";
import { EventStatus } from "@prisma/client";
import { deleteEventByUser } from "@/actions/event";
import { getUserBookmarkIds } from "@/actions/bookmark";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface IEventData {
  event: EventWithUser;
}

const EventData = ({ event: initialEvent }: IEventData) => {
  const router = useRouter();
  const [event, setEvent] = useState<EventWithUser>(initialEvent);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const user = useCurrentUser();

  useEffect(() => {
    getUserBookmarkIds().then((ids) => setIsBookmarked(ids.includes(event.id)));
  }, [event.id]);

  const likeEventHandler = async (eventId: string, eventUserId: string) => {
    const wasLiked = event.isLikedByUser;
    setEvent((prevEvent) => ({
      ...prevEvent,
      isLikedByUser: !prevEvent.isLikedByUser,
      likes: prevEvent.isLikedByUser
        ? prevEvent.likes.filter((like) => like.userId !== user?.id!)
        : [...prevEvent.likes, { id: user?.id!, userId: user?.id! }],
    }));

    const likeRes = await like(eventId);
    if (likeRes.error) {
      toast.error(likeRes.error);
      setEvent(initialEvent); // revert
      return;
    }
    if (!wasLiked) addNotification(`${user?.name}: Liked your event`, eventId, eventUserId);
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

    const attendRes = await markAsAttending(eventId);
    if (attendRes.error) {
      toast.error(attendRes.error);
      setEvent(initialEvent); // revert
      return;
    }
    if (!event.isUserAttending) {
      addNotification(`${user?.name}: Attending your event`, eventId, eventUserId);
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

    const notAttendRes = await markAsNotAttending(eventId);
    if (notAttendRes.error) {
      toast.error(notAttendRes.error);
      setEvent(initialEvent); // revert
      return;
    }
    if (!event.isUserNotAttending) {
      addNotification(`${user?.name}: Not attending your event`, eventId, eventUserId);
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
      initialBookmarked={isBookmarked}
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
