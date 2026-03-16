"use client";
import React from "react";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Heart,
  MessageCircle,
  Share2,
  Flag,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "../ui/textarea";
import { addNewReport } from "@/actions/report";
import { EventType } from "@prisma/client";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
    toast.success("Link copied to clipboard");
  };

  const reportEventHandler = async () => {
    if (reportReason.trim() === "") {
      return toast.error("Please provide a reason for reporting");
    }
    try {
      const reportResponse = await addNewReport(eventId, reportReason);
      if (reportResponse.error !== undefined) {
        toast.error(reportResponse.error);
        return;
      }
      setIsReportDialogOpen(false);
      setReportReason("");
      toast.success("Reported successfully");
    } catch {
      toast.error("An error occurred while reporting");
    }
  };

  const isEvent = eventType === EventType.EVENT;

  return (
    <>
      {/* Stats row */}
      {(likes > 0 || comments > 0 || (isEvent && attendees > 0)) && (
        <div className="mt-3 flex items-center gap-4 text-[13px] text-muted-foreground">
          {likes > 0 && (
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
              {likes}
            </span>
          )}
          {comments > 0 && (
            <Link href={`/events/details/${eventId}`} className="hover:underline">
              {comments} {comments === 1 ? "comment" : "comments"}
            </Link>
          )}
          {isEvent && attendees > 0 && (
            <span>{attendees} going</span>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
        <div className="flex items-center gap-0.5">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={eventLikeHandler}
                  className={cn(
                    "h-9 gap-1.5 rounded-full px-3 transition-colors",
                    isLiked
                      ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 hover:text-rose-500"
                      : "text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
                  )}
                >
                  <Heart className={cn("h-[18px] w-[18px]", isLiked && "fill-current")} />
                  <span className="hidden text-sm font-medium sm:inline">Like</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>{isLiked ? "Unlike" : "Like"}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-9 gap-1.5 rounded-full px-3 text-muted-foreground transition-colors hover:bg-blue-500/10 hover:text-blue-500"
                >
                  <Link href={`/events/details/${eventId}`}>
                    <MessageCircle className="h-[18px] w-[18px]" />
                    <span className="hidden text-sm font-medium sm:inline">Comment</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>Comment</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shareEventHandler}
                  className="h-9 gap-1.5 rounded-full px-3 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <Share2 className="h-[18px] w-[18px]" />
                  <span className="hidden text-sm font-medium sm:inline">Share</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>Copy link</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReportDialogOpen(true)}
                  className="h-9 rounded-full px-3 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Flag className="h-[18px] w-[18px]" />
                  <span className="sr-only">Report</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>Report</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* RSVP buttons */}
        {isEvent && (
          <div className="flex items-center gap-1.5">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isAttending ? "default" : "outline"}
                    size="sm"
                    onClick={eventAttendHandler}
                    className={cn(
                      "h-8 gap-1.5 rounded-full text-xs font-medium transition-all",
                      isAttending
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border-border hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                    )}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Going</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>Mark as going</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isNotAttending ? "default" : "outline"}
                    size="sm"
                    onClick={eventNotAttendHandler}
                    className={cn(
                      "h-8 gap-1.5 rounded-full text-xs font-medium transition-all",
                      isNotAttending
                        ? "bg-muted text-muted-foreground hover:bg-muted/80"
                        : "border-border hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Not Going</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>Mark as not going</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      {/* Report dialog */}
      <AlertDialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report this {isEvent ? "event" : "post"}</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason. Our team will review this report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Describe why you're reporting this..."
            className="min-h-[100px] resize-none"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReportReason("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={reportEventHandler}
              disabled={!reportReason.trim()}
            >
              Submit Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EventActionsCtn;
