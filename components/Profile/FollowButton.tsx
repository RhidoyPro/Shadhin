"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleFollow } from "@/actions/follow";
import { toast } from "sonner";

type Props = {
  targetUserId: string;
  initialFollowing: boolean;
};

export default function FollowButton({ targetUserId, initialFollowing }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await toggleFollow(targetUserId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setFollowing(result.following ?? false);
    });
  };

  return (
    <Button
      size="sm"
      variant={following ? "outline" : "default"}
      onClick={handleClick}
      disabled={isPending}
      className="mt-3"
    >
      {following ? "Unfollow" : "Follow"}
    </Button>
  );
}
