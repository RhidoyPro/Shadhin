"use client";
import React, { useTransition } from "react";
import CurrentUserAvatar from "../Shared/CurrentUserAvatar";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { SendIcon } from "lucide-react";
import { Card } from "../ui/card";
import { Prisma } from "@prisma/client";
import { toast } from "sonner";
import { addComment } from "@/actions/comment";
import { formatDistance } from "date-fns";
import { useSocket } from "@/context/SocketProvider";

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
  comments,
  eventId,
  eventUserId,
}: EventCommentsProps) => {
  const { sendNotification } = useSocket();
  const [isPending, startTransition] = useTransition();

  const [newComment, setNewComment] = React.useState("");

  const addNewCommentHandler = async () => {
    if (newComment.trim() === "") {
      toast.error("Please write something before commenting");
      return;
    }

    try {
      const addCommentRes = await addComment(eventId, newComment);
      if (addCommentRes.error !== undefined) {
        toast.error(addCommentRes.error);
      }
      sendNotification("Added a new comment", eventUserId, eventId);
    } catch (err) {
      toast.error("Failed to add comment");
    } finally {
      setNewComment("");
    }
  };

  return (
    <Card className="p-4 mt-4">
      <div className="flex items-center gap-2">
        <CurrentUserAvatar />
        <Input
          placeholder="Write a comment"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={isPending}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              startTransition(() => addNewCommentHandler());
            }
          }}
        />
        <Button
          variant="ghost"
          size="iconRounded"
          onClick={() => startTransition(() => addNewCommentHandler())}
          disabled={isPending}
        >
          <SendIcon />
        </Button>
      </div>
      <div>
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-2 mt-3">
            <CurrentUserAvatar size={8} />
            <div className="bg-slate-100 dark:bg-neutral-700 px-3 py-2 rounded-md">
              <div className="flex items-center justify-between gap-8">
                <p className="font-semibold text-sm">{comment.user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDistance(comment.createdAt, new Date(), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <p className="text-sm break-words">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default EventComments;
