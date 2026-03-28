"use client";
import React, { useEffect, useCallback, useTransition, useRef, useMemo } from "react";
import CurrentUserAvatar from "../Shared/CurrentUserAvatar";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  EyeIcon,
  Loader2Icon,
  MessageCircleIcon,
  MoreHorizontalIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react";
import { Card } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Prisma } from "@prisma/client";
import { toast } from "sonner";
import {
  addComment,
  deleteComment,
  fetchEventComments,
} from "@/actions/comment";
import { search } from "@/actions/search";
import { formatDistance } from "date-fns";
import { addNotification } from "@/actions/notification";
import { v4 as uuidv4 } from "uuid";
import { useCurrentUser } from "@/hooks/use-current-user";
import UserAvatar from "../Shared/UserAvatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import Link from "next/link";
import { analytics } from "@/utils/analytics";
import { useFirstAction } from "@/hooks/use-first-action";

type EventCommentWithUser = Prisma.CommentGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        image: true;
      };
    };
  };
}>;

type MentionUser = { id: string; name: string; image: string | null; isVerifiedOrg?: boolean };

type EventCommentsProps = {
  comments: EventCommentWithUser[];
  eventId: string;
  eventUserId: string;
};

function renderWithMentions(text: string) {
  const mentionRegex = /@([\w][\w ]{0,30}?)(?=\s@|\s[^@\w]|[.,!?;:\n]|$)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(<span key={match.index} className="font-semibold text-primary">@{match[1]}</span>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : text;
}

// Memoized comment content to avoid re-running renderWithMentions regex on every render
const MemoizedCommentContent = React.memo(function MemoizedCommentContent({ text }: { text: string }) {
  const rendered = useMemo(() => renderWithMentions(text), [text]);
  return <>{rendered}</>;
});

const EventComments = ({
  comments: initialComments,
  eventId,
  eventUserId,
}: EventCommentsProps) => {
  const user = useCurrentUser();
  const markFirstAction = useFirstAction();
  const [isPending, startTransition] = useTransition();

  const [newComment, setNewComment] = React.useState("");
  const [eventComments, setEventComments] =
    React.useState<EventCommentWithUser[]>(initialComments);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(initialComments.length >= 10);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  // Mention state
  const commentInputRef = useRef<HTMLInputElement>(null);
  const [mentionQuery, setMentionQuery] = React.useState("");
  const [showMentions, setShowMentions] = React.useState(false);
  const [mentionResults, setMentionResults] = React.useState<MentionUser[]>([]);
  const [mentionedUserIds, setMentionedUserIds] = React.useState<string[]>([]);
  const [cursorPos, setCursorPos] = React.useState(0);

  // Search users for @mention
  useEffect(() => {
    if (!mentionQuery || mentionQuery.length < 2) {
      setMentionResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await search(mentionQuery);
        if (res && "users" in res && Array.isArray(res.users)) {
          setMentionResults(res.users.slice(0, 6) as MentionUser[]);
        }
      } catch { /* ignore */ }
    }, 250);
    return () => clearTimeout(timer);
  }, [mentionQuery]);

  const handleCommentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewComment(val);
    const pos = e.target.selectionStart || 0;
    setCursorPos(pos);
    const textBeforeCursor = val.slice(0, pos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery("");
    }
  };

  const handleMentionSelect = (u: MentionUser) => {
    const textBeforeCursor = newComment.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf("@");
    const before = newComment.slice(0, atIndex);
    const after = newComment.slice(cursorPos);
    setNewComment(`${before}@${u.name} ${after}`);
    setShowMentions(false);
    setMentionQuery("");
    if (!mentionedUserIds.includes(u.id)) {
      setMentionedUserIds((prev) => [...prev, u.id]);
    }
    commentInputRef.current?.focus();
  };

  const addNewCommentHandler = useCallback(async () => {
    if (newComment.trim() === "") {
      toast.error("Please write something before commenting");
      return;
    }

    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    const optimisticComment: EventCommentWithUser = {
      id: uuidv4(),
      content: newComment,
      createdAt: new Date(),
      user: {
        id: user.id!,
        name: user.name!,
        image: user.image!,
      },
      updatedAt: new Date(),
      userId: user.id!,
      eventId,
    };

    setEventComments((prevComments) => [optimisticComment, ...prevComments]);
    const mentions = [...mentionedUserIds];
    setNewComment("");
    setMentionedUserIds([]);

    try {
      const addCommentRes = await addComment(eventId, newComment, mentions.length > 0 ? mentions : undefined);
      if (addCommentRes.error) {
        throw new Error(addCommentRes.error);
      }
      //update the added comment with the actual comment id from the server
      const addedComment = addCommentRes.comment;
      if (!addedComment) {
        return;
      }
      setEventComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === optimisticComment.id
            ? {
                ...optimisticComment,
                id: addedComment.id,
              }
            : comment
        )
      );
      analytics.postCommented(eventId);
      markFirstAction("comment");
      addNotification(`${user?.name}: Added a new comment`, eventId, eventUserId);
    } catch (err) {
      toast.error("Failed to add comment");
      setEventComments((prevComments) =>
        prevComments.filter((comment) => comment.id !== optimisticComment.id)
      );
    }
  }, [newComment, user, eventId, eventUserId, markFirstAction]);

  const fetchMoreComments = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const newComments = await fetchEventComments(eventId, page + 1);
      if (newComments?.length) {
        setEventComments((prevComments) => [...prevComments, ...newComments]);
        setPage((prevPage) => prevPage + 1);
        setHasMore(newComments.length >= 10);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      toast.error("Failed to load more comments");
    } finally {
      setIsLoadingMore(false);
    }
  }, [eventId, page, isLoadingMore, hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          fetchMoreComments();
        }
      },
      { threshold: 1 }
    );

    const loadMoreTrigger = document.getElementById("load-more-trigger");
    if (loadMoreTrigger) observer.observe(loadMoreTrigger);

    return () => observer.disconnect();
  }, [fetchMoreComments, hasMore, isLoadingMore]);

  const deleteCommentHandler = async (commentId: string) => {
    setEventComments((prevComments) =>
      prevComments.filter((comment) => comment.id !== commentId)
    );
    await deleteComment(commentId);
  };

  return (
    <Card className="overflow-hidden border-border/50">
      {/* Section header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50">
        <h3 className="font-semibold text-base">Comments</h3>
        <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
          {eventComments.length}
        </span>
      </div>

      {/* Comment input */}
      <div className="px-5 py-4 border-b border-border/40 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <CurrentUserAvatar size={9} />
          </div>
          <div className="relative flex-1">
            {/* Mention suggestions dropdown */}
            {showMentions && mentionResults.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
                {mentionResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleMentionSelect(u)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted transition-colors text-sm"
                  >
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarImage src={u.image || undefined} />
                      <AvatarFallback className="bg-primary/10 text-[9px] text-primary">
                        {u.name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate font-medium text-foreground">{u.name}</span>
                    {u.isVerifiedOrg && <span className="text-primary text-xs">✓</span>}
                  </button>
                ))}
              </div>
            )}
            <Input
              ref={commentInputRef}
              placeholder="Write a comment... (@ to mention)"
              value={newComment}
              onChange={handleCommentInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !showMentions) {
                  e.preventDefault();
                  startTransition(() => addNewCommentHandler());
                }
                if (e.key === "Escape") setShowMentions(false);
              }}
              className="rounded-full bg-background border-border/60 pr-11 h-10 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary/30"
            />
            <div
              className={`absolute right-1 top-1/2 -translate-y-1/2 transition-all duration-200 ${
                newComment.trim()
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-75 pointer-events-none"
              }`}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => startTransition(() => addNewCommentHandler())}
                disabled={isPending || !newComment.trim()}
              >
                {isPending ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <SendIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments list */}
      <div className="divide-y divide-border/30">
        {eventComments.map((comment) => (
          <AlertDialog key={comment.id}>
            <div className="group relative px-5 py-4 transition-colors hover:bg-muted/20">
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0 pt-0.5">
                  <UserAvatar
                    id={comment.user.id}
                    image={comment?.user?.image || ""}
                    size={8}
                  />
                </div>

                {/* Comment body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/user/${comment.user.id}`}
                      className="font-semibold text-sm hover:underline truncate"
                    >
                      {comment.user.name}
                    </Link>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatDistance(new Date(comment.createdAt), new Date(), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 break-words mt-1 leading-relaxed">
                    <MemoizedCommentContent text={comment.content} />
                  </p>
                </div>

                {/* Actions dropdown */}
                <div className="flex-shrink-0 -mt-1 -mr-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      >
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                        Actions
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer text-sm" asChild>
                        <Link href={`/user/${comment.user.id}`}>
                          <EyeIcon className="h-4 w-4 mr-2" />
                          View Profile
                        </Link>
                      </DropdownMenuItem>
                      {user?.id === comment.user.id && (
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem className="cursor-pointer text-sm text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2Icon className="h-4 w-4 mr-2" />
                            Delete Comment
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Subtle left accent on hover */}
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full" />
            </div>

            {/* AlertDialog content at the same level as DropdownMenu */}
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  comment.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteCommentHandler(comment.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ))}

        {/* Empty state */}
        {eventComments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <MessageCircleIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              No comments yet
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Be the first to share your thoughts
            </p>
          </div>
        )}
      </div>

      {/* Infinite scroll trigger */}
      {hasMore && <div id="load-more-trigger" className="h-1" />}
      {isLoadingMore && (
        <div className="flex items-center justify-center gap-2 py-4 border-t border-border/30">
          <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading more...</p>
        </div>
      )}
    </Card>
  );
};

export default EventComments;
