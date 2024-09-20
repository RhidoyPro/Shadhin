"use client";
import React, { useOptimistic, useTransition } from "react";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  BadgeAlertIcon,
  CircleCheck,
  CircleX,
  Heart,
  MessageCircle,
  Share,
  ThumbsUp,
} from "lucide-react";
import { Separator } from "../ui/separator";
import { toast } from "sonner";
import { like } from "@/actions/like";
import { markAsAttending, markAsNotAttending } from "@/actions/event-attend";
import { useRouter } from "next/navigation";
import { useSocket } from "@/context/SocketProvider";
import { Textarea } from "../ui/textarea";
import { addNewReport } from "@/actions/report";
import { EventType } from "@prisma/client";

type EventActionsCtnProps = {
  eventUserId: string;
  eventId: string;
  isLiked: boolean;
  isAttending: boolean;
  isNotAttending: boolean;
  likes: number;
  attendees: number;
  comments: number;
  eventType: EventType;
};

const EventActionsCtn = ({
  eventUserId,
  eventId,
  isLiked,
  isAttending,
  isNotAttending,
  likes,
  attendees,
  comments,
  eventType,
}: EventActionsCtnProps) => {
  const { sendNotification } = useSocket();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [reportReason, setReportReason] = React.useState("");
  const [isReportDialogOpen, setIsReportDialogOpen] = React.useState(false);

  const [isLikedOptimistic, addIsLikedOptimistic] = useOptimistic(
    isLiked,
    (state, newIsLiked: boolean) => {
      return newIsLiked;
    }
  );

  const [isAttendingOptimistic, addIsAttendingOptimistic] = useOptimistic(
    isAttending,
    (state, newIsAttending: boolean) => {
      return newIsAttending;
    }
  );

  const [isNotAttendingOptimistic, addIsNotAttendingOptimistic] = useOptimistic(
    isNotAttending,
    (state, newIsNotAttending: boolean) => {
      return newIsNotAttending;
    }
  );

  const [likesOptimistic, addLikesOptimistic] = useOptimistic(
    likes,
    (state, newLikes: number) => {
      return newLikes;
    }
  );

  const [attendeesOptimistic, addAttendeesOptimistic] = useOptimistic(
    attendees,
    (state, newAttendees: number) => {
      return newAttendees;
    }
  );

  const likeEventHandler = async () => {
    if (isLikedOptimistic) {
      addLikesOptimistic(likesOptimistic - 1);
    } else {
      addLikesOptimistic(likesOptimistic + 1);
      sendNotification(`Liked your event`, eventUserId, eventId);
    }
    addIsLikedOptimistic(!isLikedOptimistic);
    try {
      const likeResponse = await like(eventId);

      if (likeResponse.error !== undefined) {
        toast.error(likeResponse.error);
      }
    } catch (err) {
      toast.error("An error occurred while liking the event");
    }
  };

  const shareEventHandler = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/events/details/${eventId}`
    );
    toast.success("Event link copied to clipboard");
  };

  const handleAttendEvent = async () => {
    if (isAttendingOptimistic) {
      addAttendeesOptimistic(attendeesOptimistic - 1);
    } else {
      addAttendeesOptimistic(attendeesOptimistic + 1);
      sendNotification(`Attending your event`, eventUserId, eventId);
    }

    if (isNotAttendingOptimistic) {
      addIsNotAttendingOptimistic(false);
    }

    addIsAttendingOptimistic(!isAttendingOptimistic);

    try {
      const attendResponse = await markAsAttending(eventId);

      if (attendResponse.error !== undefined) {
        toast.error(attendResponse.error);
      }
    } catch (err) {
      toast.error("An error occurred while attending the event");
    }
  };

  const handleNotAttendEvent = async () => {
    if (isAttendingOptimistic) {
      addAttendeesOptimistic(attendeesOptimistic - 1);
      addIsAttendingOptimistic(false);
    }
    if (isNotAttendingOptimistic) {
      addIsNotAttendingOptimistic(false);
    }
    addIsNotAttendingOptimistic(!isNotAttendingOptimistic);
    sendNotification(`Not attending your event`, eventUserId, eventId);
    try {
      const attendResponse = await markAsNotAttending(eventId);

      if (attendResponse.error !== undefined) {
        toast.error(attendResponse.error);
      }
    } catch (err) {
      toast.error("An error occurred while not attending the event");
    }
  };

  const reportEventHandler = async () => {
    if (reportReason.trim() === "") {
      return toast.error("Please provide a reason for reporting the event");
    }

    try {
      const reportResponse = await addNewReport(eventId, reportReason);

      if (reportResponse.error !== undefined) {
        toast.error(reportResponse.error);
      }

      setIsReportDialogOpen(false);
      setReportReason("");
      toast.success("Event reported successfully");
    } catch (err) {
      toast.error("An error occurred while reporting the event");
    }
  };

  return (
    <>
      <div className="flex-1">
        <div className="flex justify-between items-center gap-4 mt-3 text-sm text-slate-500">
          <div className="flex items-center gap-1">
            <Heart className="fill-red-500 stroke-none h-4 w-4" />
            <span>
              {likesOptimistic} {likesOptimistic === 1 ? "like" : "likes"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="hover:underline cursor-pointer"
              onClick={() => router.push(`/events/details/${eventId}`)}
            >
              {comments} {comments === 1 ? "comment" : "comments"}
            </span>
            <Separator className="h-4" orientation="vertical" />
            <span>
              {attendeesOptimistic}{" "}
              {attendeesOptimistic === 1 ? "person" : "people"} going
            </span>
          </div>
        </div>
        <Separator className="my-3" />
        <div className="flex flex-col-reverse xs:flex-row xs:justify-between xs:items-center w-full">
          <div className="flex items-center justify-between xs:justify-normal gap-3">
            <Button
              variant="ghost"
              size={"iconRounded"}
              onClick={() => startTransition(() => likeEventHandler())}
              className={
                isLikedOptimistic
                  ? "bg-blue-100 text-blue-500 hover:bg-blue-100 hover:text-blue-500"
                  : ""
              }
            >
              <ThumbsUp />
            </Button>
            <Button
              variant="ghost"
              size={"iconRounded"}
              onClick={() => router.push(`/events/details/${eventId}`)}
            >
              <MessageCircle />
            </Button>
            <Button
              variant="ghost"
              size={"iconRounded"}
              onClick={shareEventHandler}
            >
              <Share />
            </Button>
            <Button
              variant="ghost"
              size={"iconRounded"}
              onClick={() => setIsReportDialogOpen(true)}
            >
              <BadgeAlertIcon />
            </Button>
          </div>
          <Separator className="mt-3 xs:hidden" />
          {eventType === EventType.EVENT && (
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size={"sm"}
                className={`w-full xs:w-auto ${
                  isAttendingOptimistic
                    ? "bg-green-100 text-green-500 hover:bg-green-100"
                    : ""
                }`}
                onClick={() => startTransition(() => handleAttendEvent())}
              >
                <CircleCheck className="mr-2" />
                Going
              </Button>
              <Button
                variant="secondary"
                size={"sm"}
                className={`w-full xs:w-auto ${
                  isNotAttendingOptimistic
                    ? "bg-red-100 text-red-500 hover:bg-red-100"
                    : ""
                }`}
                onClick={() => startTransition(() => handleNotAttendEvent())}
              >
                <CircleX className="mr-2" />
                Not Going
              </Button>
            </div>
          )}
        </div>
      </div>
      <AlertDialog
        open={isReportDialogOpen}
        onOpenChange={(isOpen) => setIsReportDialogOpen(isOpen)}
      >
        <AlertDialogTrigger asChild></AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to report this event?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please make sure to provide a valid reason for reporting this
              event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Type your reason here"
            className="w-full"
            rows={4}
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          />
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsReportDialogOpen(false);
                setReportReason("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={reportEventHandler}>Report</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EventActionsCtn;
