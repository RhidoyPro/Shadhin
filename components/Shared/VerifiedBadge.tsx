import { cn } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import { VerifiedIcon } from "lucide-react";
import React from "react";

type VerifiedBadgeProps = {
  userRole: UserRole;
  isVerifiedOrg?: boolean;
  size?: number;
};

const VerifiedBadge = ({ userRole, isVerifiedOrg, size }: VerifiedBadgeProps) => {
  // Org badge takes precedence visually — gold/amber colour
  if (isVerifiedOrg) {
    return (
      <VerifiedIcon
        className={cn("text-white fill-amber-400", size && `w-${size} h-${size}`)}
      />
    );
  }

  if (userRole === UserRole.SUPER_USER || userRole === UserRole.ADMIN) {
    return (
      <VerifiedIcon
        className={cn("text-white fill-blue-500", size && `w-${size} h-${size}`)}
      />
    );
  }

  return null;
};

export default VerifiedBadge;
