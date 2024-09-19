import { cn } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import { VerifiedIcon } from "lucide-react";
import React from "react";

type VerifiedBadgeProps = {
  userRole: UserRole;
  size?: number;
};

const VerifiedBadge = ({ userRole, size }: VerifiedBadgeProps) => {
  return userRole === UserRole.SUPER_USER || userRole === UserRole.ADMIN ? (
    <VerifiedIcon
      className={cn("text-white fill-blue-500", size && `w-${size} h-${size}`)}
    />
  ) : null;
};

export default VerifiedBadge;
