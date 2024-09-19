"use client";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { UserRound } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter } from "next/navigation";

type CurrentUserAvatarProps = {
  size?: number;
};

const CurrentUserAvatar = ({ size = 10 }: CurrentUserAvatarProps) => {
  const user = useCurrentUser();
  const router = useRouter();

  return (
    <Avatar
      className={`h-${size} w-${size} cursor-pointer`}
      onClick={() => router.push(`/user/${user?.id}`)}
    >
      <AvatarImage src={user?.image || ""} />
      <AvatarFallback>
        <UserRound className="text-slate-500" />
      </AvatarFallback>
    </Avatar>
  );
};

export default CurrentUserAvatar;
