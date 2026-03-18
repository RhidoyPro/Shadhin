"use client";
import React from "react";
import Link from "next/link";
import {
  BadgeAlertIcon,
  CalendarCheck2Icon,
  LayoutDashboardIcon,
  MegaphoneIcon,
  MenuIcon,
  ShieldIcon,
  UserIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import LogoutBtn from "../Shared/LogoutBtn";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "../ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboardIcon,
    exact: true,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: UserIcon,
    exact: false,
  },
  {
    label: "Events",
    href: "/admin/events",
    icon: CalendarCheck2Icon,
    exact: false,
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: BadgeAlertIcon,
    exact: false,
  },
  {
    label: "Broadcast",
    href: "/admin/broadcast",
    icon: MegaphoneIcon,
    exact: false,
  },
];

function NavLink({
  item,
  isActive,
}: {
  item: (typeof navItems)[number];
  isActive: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary border-l-2 border-primary"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo / Title */}
      <div className="flex items-center gap-2.5 px-3 py-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ShieldIcon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">Admin</p>
          <p className="text-xs text-muted-foreground">Shadhin.io</p>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return <NavLink key={item.href} item={item} isActive={isActive} />;
        })}
      </nav>

      <Separator className="my-4" />

      {/* Logout */}
      <LogoutBtn className="justify-start gap-3 text-sm font-medium" />
    </div>
  );
}

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border p-4">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile trigger + sheet */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" className="h-12 w-12 rounded-full shadow-lg">
              <MenuIcon className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-4">
            <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
            <SidebarContent pathname={pathname} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default Sidebar;
