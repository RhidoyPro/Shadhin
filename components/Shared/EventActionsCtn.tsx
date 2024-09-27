"use client";
import React from "react";
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
import { Textarea } from "../ui/textarea";
import { addNewReport } from "@/actions/report";
import { EventType } from "@prisma/client";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type EventActionsCtnProps = {
  eventId: string;
  isLiked: boolean;
  isAttending: boolean;
  isNotAttending: boolean;
  likes: number;
  attendees: number;
  comments: number;
  eventType: EventType;
  eventLikeHandler: () => void;
  eventAttendHandler: () => void;
  eventNotAttendHandler: () => void;
};

const EventActionsCtn = ({
  eventId,
  isLiked,
  isAttending,
  isNotAttending,
  likes,
  attendees,
  comments,
  eventType,
  eventLikeHandler,
  eventAttendHandler,
  eventNotAttendHandler,
}: EventActionsCtnProps) => {
  const [reportReason, setReportReason] = React.useState("");
  const [isReportDialogOpen, setIsReportDialogOpen] = React.useState(false);

  const shareEventHandler = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/events/details/${eventId}`
    );
    toast.success("Event link copied to clipboard");
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
              {likes} {likes === 1 ? "like" : "likes"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/events/details/${eventId}`}
              className="hover:underline cursor-pointer"
            >
              {comments} {comments === 1 ? "comment" : "comments"}
            </Link>
            {eventType === EventType.EVENT && (
              <>
                <Separator className="h-4" orientation="vertical" />
                <span>
                  {attendees} {attendees === 1 ? "person" : "people"} going
                </span>
              </>
            )}
          </div>
        </div>
        <Separator className="my-3" />
        <div className="flex flex-col-reverse xs:flex-row xs:justify-between xs:items-center w-full">
          <div className="flex items-center justify-between xs:justify-normal gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size={"iconRounded"}
                    onClick={eventLikeHandler}
                    className={
                      isLiked
                        ? "bg-blue-100 text-blue-500 hover:bg-blue-100 hover:text-blue-500"
                        : ""
                    }
                  >
                    <ThumbsUp />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">{isLiked ? "Unlike" : "Like"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size={"iconRounded"} asChild>
                    <Link href={`/events/details/${eventId}`}>
                      <MessageCircle />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Comment</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size={"iconRounded"}
                    onClick={shareEventHandler}
                  >
                    <Share />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Share</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size={"iconRounded"}
                    onClick={() => setIsReportDialogOpen(true)}
                  >
                    <BadgeAlertIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Report</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Separator className="mt-3 xs:hidden" />
          {eventType === EventType.EVENT && (
            <div className="flex items-center gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size={"sm"}
                      className={`w-full xs:w-auto ${
                        isAttending
                          ? "bg-green-100 text-green-500 hover:bg-green-100"
                          : ""
                      }`}
                      onClick={eventAttendHandler}
                    >
                      <CircleCheck className="mr-2" />
                      Going
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">
                      Mark yourself as going to this event
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size={"sm"}
                      className={`w-full xs:w-auto ${
                        isNotAttending
                          ? "bg-red-100 text-red-500 hover:bg-red-100"
                          : ""
                      }`}
                      onClick={eventNotAttendHandler}
                    >
                      <CircleX className="mr-2" />
                      Not Going
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">
                      Mark yourself as not going to this event
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
