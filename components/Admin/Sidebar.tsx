"use client";
import React from "react";
import { Button } from "../ui/button";
import Link from "next/link";
import {
  BadgeAlertIcon,
  CalendarCheck2Icon,
  LayoutDashboardIcon,
  UserIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import LogoutBtn from "../Shared/LogoutBtn";

const Sidebar = () => {
  const pathname = usePathname();
  console.log(pathname);
  return (
    <aside className="bg-white dark:bg-neutral-900 min-w-[300px] p-4 rounded-md h-full flex flex-col justify-between">
      <div className="flex flex-col gap-4 mt-4">
        <h1 className="text-2xl font-semibold text-center text-primary">
          Admin Controls
        </h1>
        <Button
          asChild
          variant={pathname === "/admin" ? "default" : "secondary"}
          className="w-full text-xl py-6"
        >
          <Link href="/admin">
            <LayoutDashboardIcon className="mr-1" />
            Dashboard
          </Link>
        </Button>
        <Button
          asChild
          variant={pathname === "/admin/users" ? "default" : "secondary"}
          className="w-full text-xl py-6"
        >
          <Link href="/admin/users">
            <UserIcon className="mr-1" />
            Users
          </Link>
        </Button>
        <Button
          asChild
          variant={pathname === "/admin/events" ? "default" : "secondary"}
          className="w-full text-xl py-6"
        >
          <Link href="/admin/events">
            <CalendarCheck2Icon className="mr-1" />
            Events
          </Link>
        </Button>
        <Button
          asChild
          variant={pathname === "/admin/reports" ? "default" : "secondary"}
          className="w-full text-xl py-6"
        >
          <Link href="/admin/reports">
            <BadgeAlertIcon className="mr-1" />
            Reports
          </Link>
        </Button>
      </div>
      <LogoutBtn className="py-6" />
    </aside>
  );
};

export default Sidebar;
