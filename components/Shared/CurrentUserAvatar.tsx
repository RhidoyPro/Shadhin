"use client";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { UserRound } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import Link from "next/link";

type CurrentUserAvatarProps = {
  size?: number;
};

const CurrentUserAvatar = ({ size = 10 }: CurrentUserAvatarProps) => {
  const user = useCurrentUser();

  return (
    <Avatar className={`h-${size} w-${size} cursor-pointer`} asChild>
      <Link href={`/user/${user?.id}`}>
        <AvatarImage src={user?.image || ""} />
        <AvatarFallback>
          <UserRound className="text-slate-500" />
        </AvatarFallback>
      </Link>
    </Avatar>
  );
};

export default CurrentUserAvatar;
