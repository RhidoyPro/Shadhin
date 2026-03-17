"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { Bell, BellDot } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { Prisma } from "@prisma/client";
import { readNotification } from "@/actions/notification";

interface INotificationItem {
  id: string;
  message: string;
  time: string;
  isRead: boolean;
  eventId: string;
}

const NotificationItem = ({
  id,
  message,
  time,
  isRead,
  eventId,
}: INotificationItem) => {
  const router = useRouter();

  const handleReadNotification = () => {
    readNotification(id);
    router.push(`/events/details/${eventId}`);
  };

  return (
    <>
      <DropdownMenuItem asChild>
        <div
          className="flex text-left gap-2 cursor-pointer"
          onClick={handleReadNotification}
        >
          {!isRead && (
            <div className="flex items-center justify-center rounded-full bg-blue-100 h-8 w-8">
              <BellDot className="h-4 w-4 text-blue-500" />
            </div>
          )}
          {isRead && (
            <div className="flex items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-700 h-8 w-8">
              <Bell className="h-4 w-4 text-gray-500 dark:text-gray-300" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-semibold w-full">{message}</span>
            <span className="text-xs text-gray-400 w-full">{time}</span>
          </div>
        </div>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
    </>
  );
};

type NotificationData = Prisma.NotificationGetPayload<{
  select: {
    id: boolean;
    message: boolean;
    userId: boolean;
    createdAt: boolean;
    eventId: boolean;
    isRead: boolean;
  };
}>;

interface INotifications {
  userNotifications: NotificationData[];
}

const POLL_INTERVAL = 10000; // 10 seconds

const Notifications = ({ userNotifications }: INotifications) => {
  const [notifications, setNotifications] = useState<NotificationData[]>(userNotifications);
  const [numberOfUnreadNotifications, setNumberOfUnreadNotifications] = useState(0);

  // Count unread whenever notifications change
  useEffect(() => {
    const unread = notifications.filter((n) => !n.isRead);
    setNumberOfUnreadNotifications(unread.length);
  }, [notifications]);

  // Poll for new notifications
  const pollNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/poll");
      if (!res.ok) return;
      const data: NotificationData[] = await res.json();
      setNotifications(data);
    } catch {
      // Silently fail — next poll will retry
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(pollNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [pollNotifications]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-[1.3rem] w-[1.3rem]" />
          <span className="sr-only">Notifications</span>
          {numberOfUnreadNotifications > 0 && (
            <div className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-xs">
              {numberOfUnreadNotifications}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-72 max-h-96 overflow-y-auto custom-scrollbar"
        align="end"
      >
        <DropdownMenuLabel>
          Notifications
          {numberOfUnreadNotifications > 0 && (
            <span className="text-xs text-blue-500 ml-1">
              ({numberOfUnreadNotifications})
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications?.length > 0 &&
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              id={notification.id}
              message={notification.message}
              time={formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
              })}
              isRead={notification.isRead}
              eventId={notification.eventId}
            />
          ))}
        {notifications?.length === 0 && (
          <DropdownMenuItem asChild>
            <span className="text-sm text-gray-400">No new notifications</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Notifications;
