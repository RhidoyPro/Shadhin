"use client";
import React, { useState, useEffect, useRef } from "react";
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
import { Button } from "@/components/ui/button";
import EventActionsCtn from "./EventActionsCtn";
import UserAvatar from "./UserAvatar";
import VerifiedBadge from "./VerifiedBadge";

export type EventWithUser = Prisma.EventGetPayload<{
  include: {
    user: true;
    likes: {
      select: {
        id: true;
        userId: true;
      };
    };
    attendees: {
      select: {
        id: true;
        userId: true;
        status: true;
      };
    };
    comments: {
      select: {
        id: true;
      };
    };
  };
}> & {
  isLikedByUser: boolean;
  isUserAttending: boolean;
  isUserNotAttending: boolean;
};

type EventCardProps = {
  event: EventWithUser;
  showFullContent?: boolean;
  eventLikeHandler: () => void;
  eventAttendHandler: () => void;
  eventNotAttendHandler: () => void;
};

const EventCard = ({
  event,
  showFullContent = false,
  eventLikeHandler,
  eventAttendHandler,
  eventNotAttendHandler,
}: EventCardProps) => {
  const [isContentClamped, setIsContentClamped] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkContentOverflow = () => {
      if (contentRef.current) {
        const isOverflowing =
          contentRef.current.scrollHeight > contentRef.current.clientHeight;
        setIsContentClamped(isOverflowing);
      }
    };

    checkContentOverflow();
    window.addEventListener("resize", checkContentOverflow);

    return () => {
      window.removeEventListener("resize", checkContentOverflow);
    };
  }, [event.content]);

  return (
    <Card>
      <CardHeader className="py-4">
        <CardTitle className="flex items-center gap-3">
          <UserAvatar
            size={14}
            image={event?.user?.image || ""}
            id={event?.user?.id}
          />
          <div>
            <h1 className="text-base font-semibold flex items-center gap-1">
              {event?.user?.name}
              <VerifiedBadge userRole={event?.user?.role as UserRole} />
            </h1>
            <p className="text-sm text-slate-400 font-medium">
              {formatDistance(event.createdAt, new Date(), {
                addSuffix: true,
              })}
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <div
          ref={contentRef}
          className={`${
            showFullContent ? "" : "line-clamp-2 sm:line-clamp-4"
          } break-words`}
        >
          {event.content}
        </div>
        {!showFullContent && isContentClamped && (
          <Link href={`/events/details/${event.id}`} passHref>
            <Button variant="link" className="p-0 h-auto font-semibold mt-1">
              Show more
            </Button>
          </Link>
        )}
        <div className="mt-2">
          {event?.type === "image" && event.mediaUrl && (
            <Image
              src={event.mediaUrl}
              alt={event.content.trim() !== "" ? event.content : "Post image"}
              width={500}
              height={500}
              className="w-full rounded-lg"
            />
          )}
          {event?.type === "video" && event.mediaUrl && (
            <video
              src={event.mediaUrl}
              controls
              className="w-full rounded-lg"
            ></video>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0 pb-2">
        <EventActionsCtn
          eventId={event.id}
          isLiked={event.isLikedByUser}
          isAttending={event.isUserAttending}
          isNotAttending={event.isUserNotAttending}
          likes={event.likes?.length}
          attendees={event.attendees?.length}
          comments={event.comments?.length}
          eventType={event.eventType}
          eventLikeHandler={eventLikeHandler}
          eventAttendHandler={eventAttendHandler}
          eventNotAttendHandler={eventNotAttendHandler}
        />
      </CardFooter>
    </Card>
  );
};

export default EventCard;
