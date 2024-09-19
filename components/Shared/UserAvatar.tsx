"use client";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

type UserAvatarProps = {
  size?: number;
  image?: string;
  id: string | number;
};

const UserAvatar = ({ size = 10, image, id }: UserAvatarProps) => {
  const router = useRouter();
  return (
    <Avatar
      className={`max-h-${size} max-w-${size} cursor-pointer relative`}
      onClick={() => router.push(`/user/${id}`)}
    >
      <AvatarImage src={image} />
      <AvatarFallback>
        <UserRound className="text-slate-500" />
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
