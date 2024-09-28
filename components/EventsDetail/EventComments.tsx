"use client";
import React, { useEffect, useCallback, useTransition } from "react";
import CurrentUserAvatar from "../Shared/CurrentUserAvatar";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  EyeIcon,
  MoreHorizontalIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react";
import { Card } from "../ui/card";
import { Prisma } from "@prisma/client";
import { toast } from "sonner";
import {
  addComment,
  deleteComment,
  fetchEventComments,
} from "@/actions/comment";
import { formatDistance } from "date-fns";
import { useSocket } from "@/context/SocketProvider";
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

type EventCommentsProps = {
  comments: EventCommentWithUser[];
  eventId: string;
  eventUserId: string;
};

const EventComments = ({
  comments: initialComments,
  eventId,
  eventUserId,
}: EventCommentsProps) => {
  const user = useCurrentUser();
  const { sendNotification } = useSocket();
  const [isPending, startTransition] = useTransition();

  const [newComment, setNewComment] = React.useState("");
  const [eventComments, setEventComments] =
    React.useState<EventCommentWithUser[]>(initialComments);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(initialComments.length >= 10);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

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
    setNewComment("");

    try {
      const addCommentRes = await addComment(eventId, newComment);
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
      sendNotification("Added a new comment", eventUserId, eventId);
    } catch (err) {
      toast.error("Failed to add comment");
      setEventComments((prevComments) =>
        prevComments.filter((comment) => comment.id !== optimisticComment.id)
      );
    }
  }, [newComment, user, eventId, eventUserId]);

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
    <Card className="p-4 mt-4">
      <div className="flex items-center gap-2">
        <CurrentUserAvatar />
        <Input
          placeholder="Write a comment"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              startTransition(() => addNewCommentHandler());
            }
          }}
        />
        <Button
          variant="ghost"
          size="iconRounded"
          onClick={() => startTransition(() => addNewCommentHandler())}
          disabled={isPending || !newComment.trim()}
        >
          <SendIcon />
        </Button>
      </div>
      <div className="mt-4 space-y-3">
        {eventComments.map((comment) => (
          <div
            key={comment.id}
            className="flex items-center gap-2 relative group"
          >
            <UserAvatar
              id={comment.user.id}
              image={comment?.user?.image || ""}
              size={8}
            />
            <div className="bg-slate-100 dark:bg-neutral-700 px-3 py-2 rounded-md w-fit">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm">{comment.user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDistance(new Date(comment.createdAt), new Date(), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <p className="text-sm break-words mt-1">{comment.content}</p>
            </div>
            <AlertDialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="p-2 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:ring-primary focus-visible:ring-offset-primary/20"
                  >
                    <MoreHorizontalIcon size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Event Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" asChild>
                    <Link href={`/user/${comment.user.id}`}>
                      <EyeIcon size={16} className="mr-2" />
                      View Commenter Profile
                    </Link>
                  </DropdownMenuItem>
                  {user?.id === comment.user.id && (
                    <AlertDialogTrigger asChild>
                      <p className="text-sm flex items-center p-2 text-red-500 hover:bg-gray-100 cursor-pointer">
                        <Trash2Icon size={16} className="mr-2" />
                        Delete
                      </p>
                    </AlertDialogTrigger>
                  )}
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you sure you want to delete this comment? ?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete the comment.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteCommentHandler(comment.id)}
                      >
                        Continue
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </DropdownMenuContent>
              </DropdownMenu>
            </AlertDialog>
          </div>
        ))}
        {eventComments.length === 0 && (
          <div className="flex items-center justify-center">
            <p className="text-lg text-slate-400">No comments yet</p>
          </div>
        )}
      </div>
      {hasMore && <div id="load-more-trigger" className="h-1" />}
      {isLoadingMore && (
        <div className="flex justify-center mt-4">
          <p className="text-sm text-slate-500">Loading more comments...</p>
        </div>
      )}
    </Card>
  );
};

export default EventComments;
