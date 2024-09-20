"use client";
import React, { useEffect, useState } from "react";
import EventCard, { EventWithUser } from "@/components/Shared/EventCard";
import { useInView } from "react-intersection-observer";
import { fetchUserEvents } from "@/actions/event";
import ClipLoader from "react-spinners/ClipLoader";

interface EventsCtnProps {
  initialEvents: EventWithUser[];
  username: string;
  userId: string;
}

const EventsCtn = ({ initialEvents, username, userId }: EventsCtnProps) => {
  const [events, setEvents] = useState<EventWithUser[]>(initialEvents || []);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [ref, inView] = useInView();

  const fetchMoreEvents = async () => {
    const newEvents = await fetchUserEvents(userId, page + 1);
    if (newEvents?.length) {
      setPage(page + 1);
      setEvents([...events, ...newEvents]);
      return;
    }
    setHasMore(false);
  };

  useEffect(() => {
    if (inView) {
      fetchMoreEvents();
    }
  }, [inView]);

  return (
    <>
      {events?.length ? (
        events.map((event) => <EventCard key={event.id} event={event} />)
      ) : (
        <p className="text-center text-lg text-gray-600 mt-4">
          There are no events for{" "}
          <span className="text-gray-800 font-semibold capitalize">
            {username}
          </span>
        </p>
      )}
      {hasMore && (
        <div ref={ref} className="flex items-center justify-center my-4">
          <ClipLoader color="#16a34a" size={30} />
        </div>
      )}
    </>
  );
};

export default EventsCtn;
