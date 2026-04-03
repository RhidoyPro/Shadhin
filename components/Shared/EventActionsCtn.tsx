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
  Flag,
  CheckCircle2,
  XCircle,
  Bookmark,
} from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "../ui/textarea";
import { addNewReport } from "@/actions/report";
import { toggleBookmark } from "@/actions/bookmark";
import { EventType } from "@prisma/client";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { analytics } from "@/utils/analytics";
import { useFirstAction } from "@/hooks/use-first-action";
import { useTranslations } from "@/components/I18nProvider";

type EventActionsCtnProps = {
  eventId: string;
  isLiked: boolean;
  isAttending: boolean;
  isNotAttending: boolean;
  likes: number;
  attendees: number;
  comments: number;
  eventType: EventType;
  initialBookmarked?: boolean;
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
  initialBookmarked = false,
  eventLikeHandler,
  eventAttendHandler,
  eventNotAttendHandler,
}: EventActionsCtnProps) => {
  const t = useTranslations("eventActions");
  const tc = useTranslations("common");
  const markFirstAction = useFirstAction();
  const [reportReason, setReportReason] = React.useState("");
  const [isReportDialogOpen, setIsReportDialogOpen] = React.useState(false);
  const [isBookmarked, setIsBookmarked] = React.useState(initialBookmarked);

  const bookmarkHandler = async () => {
    setIsBookmarked((prev) => !prev);
    const res = await toggleBookmark(eventId);
    if ("error" in res) {
      setIsBookmarked((prev) => !prev);
      toast.error(res.error);
      return;
    }
    if (res.bookmarked) {
      analytics.postBookmarked(eventId);
    } else {
      analytics.postUnbookmarked(eventId);
    }
    toast.success(res.bookmarked ? tc("saved") : tc("removedFromSaved"));
  };

  const reportEventHandler = async () => {
    if (reportReason.trim() === "") {
      return toast.error(t("reportReason"));
    }
    try {
      const reportResponse = await addNewReport(eventId, reportReason);
      if (reportResponse.error !== undefined) {
        toast.error(reportResponse.error);
        return;
      }
      setIsReportDialogOpen(false);
      setReportReason("");
      toast.success(t("reportSuccess"), { description: t("reportHelpNudge") });
    } catch {
      toast.error(t("reportError"));
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
              {comments} {tc("comments")}
            </Link>
          )}
          {isEvent && attendees > 0 && (
            <span>{attendees} {tc("going").toLowerCase()}</span>
          )}
        </div>
      )}

      {/* Action buttons */}
      <TooltipProvider delayDuration={300}>
      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!isLiked) { analytics.postLiked(eventId); markFirstAction("like"); }
                  else { analytics.postUnliked(eventId); }
                  eventLikeHandler();
                }}
                className={cn(
                  "h-9 gap-1.5 rounded-full px-3 transition-colors",
                  isLiked
                    ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 hover:text-rose-500"
                    : "text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
                )}
              >
                <Heart className={cn("h-[18px] w-[18px]", isLiked && "fill-current")} />
                <span className="hidden text-sm font-medium sm:inline">{tc("like")}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>{isLiked ? tc("unlike") : tc("like")}</p></TooltipContent>
          </Tooltip>

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
                  <span className="hidden text-sm font-medium sm:inline">{tc("comment")}</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>{tc("comment")}</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={bookmarkHandler}
                className={cn(
                  "h-9 rounded-full px-3 transition-colors",
                  isBookmarked
                    ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 hover:text-amber-500"
                    : "text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500"
                )}
              >
                <Bookmark className={cn("h-[18px] w-[18px]", isBookmarked && "fill-current")} />
                <span className="sr-only">{isBookmarked ? tc("unsave") : tc("save")}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>{isBookmarked ? tc("unsave") : tc("save")}</p></TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReportDialogOpen(true)}
                className="h-9 rounded-full px-3 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Flag className="h-[18px] w-[18px]" />
                <span className="sr-only">{tc("report")}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>{tc("report")}</p></TooltipContent>
          </Tooltip>
        </div>

        {/* RSVP buttons */}
        {isEvent && (
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isAttending ? "default" : "outline"}
                  size="sm"
                  onClick={() => { analytics.eventAttending(eventId); markFirstAction("attend"); eventAttendHandler(); }}
                  className={cn(
                    "h-8 gap-1.5 rounded-full text-xs font-medium transition-all",
                    isAttending
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border-border hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tc("going")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>{tc("markAsGoing")}</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isNotAttending ? "default" : "outline"}
                  size="sm"
                  onClick={() => { analytics.eventNotAttending(eventId); eventNotAttendHandler(); }}
                  className={cn(
                    "h-8 gap-1.5 rounded-full text-xs font-medium transition-all",
                    isNotAttending
                      ? "bg-muted text-muted-foreground hover:bg-muted/80"
                      : "border-border hover:bg-muted hover:text-foreground"
                  )}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tc("notGoing")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>{tc("markAsNotGoing")}</p></TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
      </TooltipProvider>

      {/* Report dialog */}
      <AlertDialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isEvent ? t("reportEvent") : t("reportPost")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("reportReason")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder={t("reportPlaceholder")}
            className="min-h-[100px] resize-none"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReportReason("")}>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={reportEventHandler}
              disabled={!reportReason.trim()}
            >
              {t("submitReport")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EventActionsCtn;
