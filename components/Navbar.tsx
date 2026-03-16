import React from "react";
import { ModeToggle } from "./ModeToggle";
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
import { Search, UserRound } from "lucide-react";
import Notifications from "./Notifications";
import { getUserNotifications } from "@/data/notifications";
import { UserRole } from "@prisma/client";
import Image from "next/image";
import LogoImg from "@/public/logo.png";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

const Navbar = async () => {
  const session = await auth();
  const userNotifications = await getUserNotifications(session?.user?.id!);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <Link href={DEFAULT_LOGIN_REDIRECT} className="flex items-center gap-2">
          <Image
            src={LogoImg}
            alt="Shadhin.io"
            width={32}
            height={32}
            priority
            className="rounded-lg"
          />
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            Shadhin<span className="text-primary">.io</span>
          </h1>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {session?.user && (
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted" asChild>
              <Link href="/search" aria-label="Search">
                <Search className="h-4 w-4 text-muted-foreground" />
              </Link>
            </Button>
          )}
          {session?.user && (
            <Notifications userNotifications={userNotifications || []} />
          )}
          <ModeToggle />
          {!session?.user && (
            <>
              <Button variant="outline" className="sm:w-24 rounded-full" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button className="sm:w-24 rounded-full" asChild>
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
          {session?.user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full p-0 hover:bg-transparent">
                  <Avatar className="h-8 w-8 ring-2 ring-primary/20 transition-all hover:ring-primary/40">
                    <AvatarImage
                      src={session?.user?.image || ""}
                      className="object-contain bg-muted"
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      <UserRound className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-3 p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={session?.user?.image || ""} className="object-contain bg-muted" />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      <UserRound className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 truncate">
                    <p className="truncate text-sm font-medium">{session?.user?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{session?.user?.email}</p>
                  </div>
                </div>
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
                  <Link href={`/user/${session?.user?.id}`} className="cursor-pointer">
                    View/Update Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <LogoutBtn />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
