import React from "react";
import { ModeToggle } from "./ModeToggle";
import Logo from "./Shared/Logo";
import { auth } from "@/auth";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LogoutBtn from "./Shared/LogoutBtn";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { UserRound } from "lucide-react";
import Notifications from "./Notifications";
import { getUserNotifications } from "@/data/notifications";
import { UserRole } from "@prisma/client";

const Navbar = async () => {
  const session = await auth();
  const userNotifications = await getUserNotifications(session?.user?.id!);
  return (
    <nav className="py-4 px-4 flex justify-between items-center gap-3 bg-white dark:bg-black shadow-md sticky top-0 left-0 z-40">
      <Logo />
      <div className="flex items-center gap-1 sm:gap-3">
        {session?.user && (
          <Notifications userNotifications={userNotifications || []} />
        )}
        <ModeToggle />
        {!session?.user && (
          <>
            <Button variant="outline" className="sm:w-24" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button className="sm:w-24" asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
          </>
        )}
        {session?.user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarImage src={session?.user?.image || ""} />
                <AvatarFallback>
                  <UserRound className="text-slate-500" />
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {session?.user?.role === UserRole.ADMIN && (
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="cursor-pointer">
                    Admin Panel
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/leaderboard" className="cursor-pointer">
                  Leaderboard 🏆
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/user/${session?.user?.id}`}
                  className="cursor-pointer"
                >
                  View/Update Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem asChild>
                <LogoutBtn />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
