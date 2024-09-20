"use client";
import React, { useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { formatDistance } from "date-fns";
import { Prisma, UserRole } from "@prisma/client";
import Link from "next/link";
import EventActionsCtn from "./EventActionsCtn";
import UserAvatar from "./UserAvatar";
import VerifiedBadge from "./VerifiedBadge";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getUserDataForEvent } from "@/actions/user";
import { fetchEventData } from "@/actions/event";

export type EventWithUser = Prisma.EventGetPayload<{
  include: {
    user: true;
    likes: {
      select: {
        id: true;
      };
    };
    attendees: {
      select: {
        id: true;
      };
    };
    comments: {
      select: {
        id: true;
      };
    };
  };
}>;

type EventCardProps = {
  event: EventWithUser;
  showFullContent?: boolean;
};

const EventCard = ({ event, showFullContent = false }: EventCardProps) => {
  const user = useCurrentUser();
  const [isLiked, setIsLiked] = React.useState<boolean>(false);
  const [isAttending, setIsAttending] = React.useState<boolean>(false);
  const [isNotAttending, setIsNotAttending] = React.useState<boolean>(false);
  const [eventData, setEventData] = React.useState<EventWithUser>(event);

  const fetchData = async () => {
    const { isLikedByUser, isUserAttending, isUserNotAttending } =
      await getUserDataForEvent(event.id, user?.id!);
    setIsLiked(isLikedByUser);
    setIsAttending(isUserAttending);
    setIsNotAttending(isUserNotAttending);
  };

  useEffect(() => {
    if (!user || !event.id) return;
    fetchData();
  }, [event.id, user?.id]);

  const getEventData = async () => {
    const eventData = await fetchEventData(event.id);
    if (!eventData) return;
    setEventData(eventData);
  };

  const refetchData = async () => {
    fetchData();
    getEventData();
  };

  return (
    <Card>
      <CardHeader className="py-4">
        <CardTitle className="flex items-center gap-3">
          <UserAvatar
            size={14}
            image={eventData?.user?.image || ""}
            id={eventData?.user?.id}
          />
          <div>
            <h1 className="text-base font-semibold flex items-center gap-1">
              {eventData?.user?.name}
              <VerifiedBadge userRole={eventData?.user?.role as UserRole} />
            </h1>
            <p className="text-sm text-slate-400 font-medium">
              {formatDistance(eventData.createdAt, new Date(), {
                addSuffix: true,
              })}
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        {!showFullContent && (
          <Link
            href={`/events/details/${eventData.id}`}
            className="line-clamp-2 sm:line-clamp-4 cursor-pointer break-words"
          >
            {eventData.content}
          </Link>
        )}
        {showFullContent && <p className="break-words">{eventData.content}</p>}
        <div className="mt-2">
          {event?.type === "image" && eventData.mediaUrl && (
            <Image
              src={eventData.mediaUrl}
              alt={
                eventData.content.trim() !== ""
                  ? eventData.content
                  : "Post image"
              }
              width={500}
              height={500}
              className="w-full rounded-lg"
            />
          )}
          {event?.type === "video" && eventData.mediaUrl && (
            <video
              src={eventData.mediaUrl}
              controls
              className="w-full rounded-lg"
            ></video>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0 pb-2">
        <EventActionsCtn
          eventUserId={eventData.user.id}
          eventId={eventData.id}
          isLiked={isLiked}
          isAttending={isAttending}
          isNotAttending={isNotAttending}
          likes={eventData.likes?.length}
          attendees={eventData.attendees?.length}
          comments={eventData.comments?.length}
          eventType={eventData.eventType}
          refetch={refetchData}
        />
      </CardFooter>
    </Card>
  );
};

export default EventCard;
