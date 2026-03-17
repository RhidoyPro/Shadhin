"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleFollow } from "@/actions/follow";
import { toast } from "sonner";
import { UserPlus, UserCheck, UserMinus } from "lucide-react";

type Props = {
  targetUserId: string;
  initialFollowing: boolean;
};

export default function FollowButton({ targetUserId, initialFollowing }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isPending, startTransition] = useTransition();
  const [isHovered, setIsHovered] = useState(false);

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
      size="default"
      variant={following ? "outline" : "default"}
      onClick={handleClick}
      disabled={isPending}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`mt-4 rounded-full px-6 gap-2 transition-all duration-200 ${
        following && isHovered
          ? "border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
          : ""
      }`}
    >
      {following ? (
        isHovered ? (
          <>
            <UserMinus className="h-4 w-4" />
            Unfollow
          </>
        ) : (
          <>
            <UserCheck className="h-4 w-4" />
            Following
          </>
        )
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          Follow
        </>
      )}
    </Button>
  );
}
