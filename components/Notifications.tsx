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
import { Bell, BellDot, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { Prisma } from "@prisma/client";
import { readNotification, markAllNotificationsRead } from "@/actions/notification";

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
    <DropdownMenuItem asChild>
      <div
        className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
          !isRead ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/60"
        }`}
        onClick={handleReadNotification}
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            !isRead
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {isRead ? (
            <Bell className="h-3.5 w-3.5" />
          ) : (
            <BellDot className="h-3.5 w-3.5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-snug ${!isRead ? "font-medium text-foreground" : "text-foreground/80"}`}>
            {message}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{time}</p>
        </div>
        {!isRead && (
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
        )}
      </div>
    </DropdownMenuItem>
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

const POLL_INTERVAL = 20000; // 20 seconds

const Notifications = ({ userNotifications }: INotifications) => {
  const [notifications, setNotifications] = useState<NotificationData[]>(userNotifications);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const numberOfUnreadNotifications = notifications.filter((n) => !n.isRead).length;

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
    let interval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (!interval) {
        interval = setInterval(pollNotifications, POLL_INTERVAL);
      }
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        pollNotifications(); // Fetch immediately when tab becomes visible
        startPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pollNotifications]);

  const handleMarkAllRead = async () => {
    if (isMarkingAll || numberOfUnreadNotifications === 0) return;
    setIsMarkingAll(true);
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await markAllNotificationsRead();
    setIsMarkingAll(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full hover:bg-muted"
        >
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Notifications</span>
          {numberOfUnreadNotifications > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {numberOfUnreadNotifications > 9 ? "9+" : numberOfUnreadNotifications}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 max-h-[420px] overflow-y-auto"
        align="end"
      >
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">
            Notifications
            {numberOfUnreadNotifications > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
                {numberOfUnreadNotifications}
              </span>
            )}
          </DropdownMenuLabel>
          {numberOfUnreadNotifications > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="mb-0" />
        {notifications.length > 0 ? (
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
          ))
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Notifications;
