"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { EventType, Prisma, UserRole } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import EventActionsCtn from "./EventActionsCtn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import VerifiedBadge from "./VerifiedBadge";
import { Eye, ImageOff, Link2, Megaphone, MessageCircle, MoreHorizontal, Pencil, Share2, Ticket, Trash2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import FormattedContent from "./FormattedContent";
import { analytics } from "@/utils/analytics";
import { cn } from "@/lib/utils";
import { editEvent } from "@/actions/event";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import BoostPostDialog from "./BoostPostDialog";
import BuyTicketDialog from "./BuyTicketDialog";

export type EventWithUser = Prisma.EventGetPayload<{
  include: {
    user: { select: { id: true; name: true; image: true; email: true; role: true; isVerifiedOrg: true } };
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
  _count?: { comments: number };
};

type EventCardProps = {
  event: EventWithUser;
  showFullContent?: boolean;
  initialBookmarked?: boolean;
  eventLikeHandler: () => void;
  eventAttendHandler: () => void;
  eventNotAttendHandler: () => void;
  onDeleteEvent: () => void;
};

const EventCard = ({
  event,
  showFullContent = false,
  initialBookmarked = false,
  eventLikeHandler,
  eventAttendHandler,
  eventNotAttendHandler,
  onDeleteEvent,
}: EventCardProps) => {
  const user = useCurrentUser();
  const [isContentClamped, setIsContentClamped] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(event.content);
  const [displayContent, setDisplayContent] = useState(event.content);
  const [isSaving, setIsSaving] = useState(false);
  const [isBoostOpen, setIsBoostOpen] = useState(false);
  const [isBuyTicketOpen, setIsBuyTicketOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkContentOverflow = () => {
      if (contentRef.current) {
        setIsContentClamped(
          contentRef.current.scrollHeight > contentRef.current.clientHeight
        );
      }
    };
    checkContentOverflow();
    window.addEventListener("resize", checkContentOverflow);
    return () => window.removeEventListener("resize", checkContentOverflow);
  }, [displayContent]);

  const isEvent = event.eventType === EventType.EVENT;
  const isOwner = user?.id === event.user.id;

  const handleShare = async (method?: "whatsapp" | "facebook") => {
    const baseUrl = `${window.location.origin}/events/details/${event.id}`;
    const text = displayContent.slice(0, 100);

    if (method === "whatsapp") {
      const url = `${baseUrl}?ref=share&method=whatsapp`;
      analytics.postShared(event.id, "whatsapp");
      window.open(
        `https://wa.me/?text=${encodeURIComponent(text + "\n\n" + url)}`,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }

    if (method === "facebook") {
      const url = `${baseUrl}?ref=share&method=facebook`;
      analytics.postShared(event.id, "facebook");
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }

    // Default: native share on mobile, copy link on desktop
    const shareUrl = `${baseUrl}?ref=share&method=direct`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${event.user.name} on Shadhin.io`,
          text,
          url: shareUrl,
        });
        analytics.postShared(event.id, "native");
      } catch {
        // User cancelled — no-op
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      analytics.postShared(event.id, "copy_link");
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <article className="group relative bg-card transition-colors hover:bg-muted/30">
      <div className="flex gap-3 p-4 sm:gap-3.5">
        {/* Avatar */}
        <Link href={`/user/${event.user.id}`} className="shrink-0">
          <Avatar className="h-10 w-10 ring-2 ring-border/50 transition-all hover:ring-primary/30 hover:scale-105">
            <AvatarImage src={event.user.image || undefined} alt={event.user.name || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {event.user.name?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Link
                href={`/user/${event.user.id}`}
                className="font-semibold text-foreground hover:underline text-[15px]"
              >
                {event.user.name}
              </Link>
              <VerifiedBadge userRole={event.user.role as UserRole} isVerifiedOrg={event.user.isVerifiedOrg} />
              <span className="text-muted-foreground text-sm">·</span>
              <time className="text-sm text-muted-foreground" suppressHydrationWarning>
                {formatDistanceToNow(event.createdAt, { addSuffix: true })}
              </time>
              {isEvent && (
                <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Event
                </span>
              )}
              {isEvent && event.ticketPrice && (
                <span className="ml-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                  ৳{event.ticketPrice} / ticket
                </span>
              )}
              {event.isPromoted && (
                <span className="ml-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                  Promoted
                </span>
              )}
            </div>

            {/* Actions menu */}
            <AlertDialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100 hover:bg-muted"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href={`/events/details/${event.id}`} className="flex items-center gap-2 cursor-pointer">
                      <Eye className="h-4 w-4" />
                      View {isEvent ? "Event" : "Post"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => handleShare("whatsapp")}>
                    <MessageCircle className="mr-2 h-4 w-4 text-green-500" />
                    Share on WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => handleShare("facebook")}>
                    <Share2 className="mr-2 h-4 w-4 text-blue-500" />
                    Share on Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => handleShare()}>
                    <Link2 className="mr-2 h-4 w-4" />
                    Copy Link
                  </DropdownMenuItem>
                  {isOwner && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => {
                          setEditContent(displayContent);
                          setIsEditing(true);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit {isEvent ? "Event" : "Post"}
                      </DropdownMenuItem>
                      {!event.isPromoted && (
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => setIsBoostOpen(true)}
                        >
                          <Megaphone className="mr-2 h-4 w-4" />
                          Boost Post
                        </DropdownMenuItem>
                      )}
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete {isEvent ? "Event" : "Post"}
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete this {isEvent ? "event" : "post"}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the{" "}
                    {isEvent ? "event" : "post"}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDeleteEvent}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Post content */}
          <div className="mt-2">
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[80px] text-[15px]"
                  maxLength={2000}
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    disabled={isSaving || !editContent.trim()}
                    onClick={async () => {
                      setIsSaving(true);
                      const res = await editEvent(event.id, editContent);
                      setIsSaving(false);
                      if (res.error) {
                        toast.error(res.error);
                        return;
                      }
                      setDisplayContent(editContent.trim());
                      toast.success("Updated");
                      setIsEditing(false);
                    }}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div
                  ref={contentRef}
                  className={cn(
                    "break-words text-[15px] leading-relaxed text-foreground",
                    !showFullContent && "line-clamp-4"
                  )}
                >
                  <FormattedContent content={displayContent} />
                </div>
                {!showFullContent && isContentClamped && (
                  <Link
                    href={`/events/details/${event.id}`}
                    className="mt-1 inline-block text-sm font-medium text-primary hover:underline"
                  >
                    Show more
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Media */}
          {event.type === "image" && event.mediaUrl && !mediaError && (
            <div className="mt-3 overflow-hidden rounded-xl border border-border">
              <Image
                src={event.mediaUrl}
                alt={displayContent.trim() !== "" ? displayContent : "Post image"}
                width={600}
                height={400}
                sizes="(max-width: 768px) 100vw, 600px"
                className="w-full object-cover"
                onError={() => setMediaError(true)}
              />
            </div>
          )}
          {event.type === "image" && event.mediaUrl && mediaError && (
            <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/50 py-12 text-muted-foreground">
              <ImageOff className="h-5 w-5" />
              <span className="text-sm">Image unavailable</span>
            </div>
          )}
          {event.type === "video" && event.mediaUrl && !mediaError && (
            <div className="mt-3 overflow-hidden rounded-xl border border-border">
              <video
                src={event.mediaUrl}
                controls
                preload="none"
                className="w-full"
                onError={() => setMediaError(true)}
              />
            </div>
          )}
          {event.type === "video" && event.mediaUrl && mediaError && (
            <div className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/50 py-12 text-muted-foreground">
              <ImageOff className="h-5 w-5" />
              <span className="text-sm">Video unavailable</span>
            </div>
          )}

          {/* Actions */}
          <EventActionsCtn
            eventId={event.id}
            isLiked={event.isLikedByUser}
            isAttending={event.isUserAttending}
            isNotAttending={event.isUserNotAttending}
            likes={event.likes?.length}
            attendees={event.attendees?.length}
            comments={event._count?.comments ?? event.comments?.length ?? 0}
            eventType={event.eventType}
            initialBookmarked={initialBookmarked}
            eventLikeHandler={eventLikeHandler}
            eventAttendHandler={eventAttendHandler}
            eventNotAttendHandler={eventNotAttendHandler}
          />

          {isEvent && event.ticketPrice && !isOwner && (
            <div className="mt-2 pt-2 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 gap-1.5"
                onClick={() => setIsBuyTicketOpen(true)}
              >
                <Ticket className="h-3.5 w-3.5" />
                Buy Ticket — ৳{event.ticketPrice}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Boost Post Dialog — rendered outside the DropdownMenu */}
      <BoostPostDialog
        eventId={event.id}
        eventTitle={event.content.slice(0, 60)}
        open={isBoostOpen}
        onClose={() => setIsBoostOpen(false)}
      />

      {isEvent && event.ticketPrice && (
        <BuyTicketDialog
          eventId={event.id}
          ticketPrice={event.ticketPrice}
          eventTitle={displayContent.slice(0, 60)}
          open={isBuyTicketOpen}
          onClose={() => setIsBuyTicketOpen(false)}
        />
      )}
    </article>
  );
};

export default EventCard;
