"use client";
import React, { useState, useEffect, useRef } from "react";
import { ModeToggle } from "./ModeToggle";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "./ui/input";
import LogoutBtn from "./Shared/LogoutBtn";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Search, UserRound, Plus, HelpCircle } from "lucide-react";
import Notifications from "./Notifications";
import { UserRole, Prisma } from "@prisma/client";
import Image from "next/image";
import LogoImg from "@/public/logo.png";
import LogoWhiteImg from "@/public/logo-white.png";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { useRouter } from "next/navigation";
import { Session } from "next-auth";
import UploadEventModal from "./Shared/UploadEventModal";
import { useTranslations } from "@/components/I18nProvider";

type NavbarProps = {
  session: Session | null;
  userNotifications: Prisma.NotificationGetPayload<{
    select: {
      id: boolean;
      message: boolean;
      userId: boolean;
      createdAt: boolean;
      eventId: boolean;
      isRead: boolean;
    };
  }>[];
};

const Navbar = ({ session, userNotifications }: NavbarProps) => {
  const t = useTranslations("nav");
  const ta = useTranslations("auth");
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (searchValue.trim()) {
      timerRef.current = setTimeout(() => {
        router.push(`/search?q=${encodeURIComponent(searchValue)}`);
      }, 300);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [searchValue, router]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        {/* Main bar */}
        <div className="flex h-14 items-center justify-between px-4 lg:px-6">
          {/* Logo */}
          <Link href={DEFAULT_LOGIN_REDIRECT} className="flex items-center gap-2 shrink-0">
            <Image
              src={LogoImg}
              alt="Shadhin.io"
              width={32}
              height={32}
              priority
              className="rounded-lg dark:hidden"
            />
            <Image
              src={LogoWhiteImg}
              alt="Shadhin.io"
              width={32}
              height={32}
              priority
              className="rounded-lg hidden dark:block"
            />
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              Shadhin<span className="text-primary">.io</span>
            </h1>
          </Link>

          {/* Desktop search */}
          {session?.user && (
            <div className="hidden flex-1 max-w-md mx-8 md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={t("search")}
                  className="h-9 w-full rounded-full border-0 bg-muted/60 pl-9 pr-4 text-sm placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {session?.user && (
              <>
                {/* Mobile search toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full md:hidden hover:bg-muted"
                  onClick={() => setShowSearch(!showSearch)}
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <span className="sr-only">Search</span>
                </Button>

                {/* Create button — desktop */}
                <Button
                  size="sm"
                  className="hidden h-8 gap-1.5 rounded-full px-3.5 text-xs font-medium shadow-lg shadow-primary/25 hover:shadow-primary/35 sm:flex"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("create")}
                </Button>
                {/* Create button — mobile */}
                <Button
                  size="icon"
                  className="h-9 w-9 rounded-full shadow-lg shadow-primary/25 hover:bg-primary/90 sm:hidden"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Create</span>
                </Button>

                <Notifications userNotifications={userNotifications} />
              </>
            )}

            <ModeToggle />

            {!session?.user && (
              <>
                <Button variant="outline" className="sm:w-24 rounded-full" asChild>
                  <Link href="/login">{ta("logIn")}</Link>
                </Button>
                <Button className="sm:w-24 rounded-full" asChild>
                  <Link href="/signup">{ta("signUp")}</Link>
                </Button>
              </>
            )}

            {session?.user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full p-0 hover:bg-transparent">
                    <Avatar className="h-8 w-8 ring-2 ring-primary/20 transition-all hover:ring-primary/40">
                      <AvatarImage
                        src={session.user.image || ""}
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
                      <AvatarImage src={session.user.image || ""} className="object-contain bg-muted" />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        <UserRound className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 truncate">
                      <p className="truncate text-sm font-medium">{session.user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {(session.user.role === UserRole.ADMIN ||
                    session.user.role === UserRole.SUPER_USER) && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">{t("adminPanel")}</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/leaderboard" className="cursor-pointer">{t("leaderboard")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bookmarks" className="cursor-pointer">{t("savedPosts")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/user/${session.user.id}`} className="cursor-pointer">
                      {t("viewProfile")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      {t("settings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="mailto:help@shadhin.io" className="cursor-pointer flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      {t("helpSupport")}
                    </a>
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

        {/* Mobile search expand */}
        {showSearch && session?.user && (
          <div className="border-t border-border p-3 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={t("search")}
                className="h-9 w-full rounded-full border-0 bg-muted/60 pl-9 text-sm"
                autoFocus
              />
            </div>
          </div>
        )}
      </header>

      {session?.user && (
        <UploadEventModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          isStatus={true}
        />
      )}
    </>
  );
};

export default Navbar;
