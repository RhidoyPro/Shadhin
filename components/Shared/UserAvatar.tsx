"use client";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { UserRound } from "lucide-react";
import Link from "next/link";

type UserAvatarProps = {
  size?: number;
  image?: string;
  id: string | number;
};

const UserAvatar = ({ size = 10, image, id }: UserAvatarProps) => {
  return (
    <Avatar className="cursor-pointer relative" style={{ maxHeight: size * 4, maxWidth: size * 4 }}>
      <Link href={`/user/${id}`}>
        <AvatarImage src={image} className="object-contain bg-gray-100 dark:bg-neutral-700" />
        <AvatarFallback>
          <UserRound className="text-slate-500 dark:text-slate-300" />
        </AvatarFallback>
      </Link>
    </Avatar>
  );
};

export default UserAvatar;
