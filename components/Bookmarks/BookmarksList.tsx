"use client";

import React, { useEffect, useState } from "react";
import { getBookmarkedEvents } from "@/actions/bookmark";
import { Bookmark } from "lucide-react";

type BookmarkedEvent = Awaited<ReturnType<typeof getBookmarkedEvents>>[number];

const BookmarksList = () => {
  const [events, setEvents] = useState<BookmarkedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBookmarkedEvents().then((data) => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-lg font-medium text-muted-foreground">No saved posts yet</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Bookmark posts from your feed to find them here later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <a
          key={event.id}
          href={`/events/details/${event.id}`}
          className="block rounded-lg border border-border bg-card p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
              {event.user.name?.charAt(0) || "?"}
            </div>
            <div>
              <p className="text-sm font-medium">{event.user.name}</p>
              <p className="text-xs text-muted-foreground">{event.stateName}</p>
            </div>
          </div>
          <p className="text-sm line-clamp-3">{event.content}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span>{event.likes.length} likes</span>
            <span>{event.comments.length} comments</span>
          </div>
        </a>
      ))}
    </div>
  );
};

export default BookmarksList;
