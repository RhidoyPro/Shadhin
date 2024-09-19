import React from "react";
import Navbar from "@/components/Navbar";
import EventCard from "@/components/Shared/EventCard";
import EventComments from "@/components/EventsDetail/EventComments";
import { getEventById } from "@/data/events";
import { getCommentsByEventId } from "@/data/comments";

const EventDetailPage = async ({ params }: { params: { eventId: string } }) => {
  const event = await getEventById(params.eventId);
  const comments = (await getCommentsByEventId(params.eventId)) || [];
  return (
    <main className="bg-slate-100 dark:bg-neutral-700 min-h-screen relative">
      <Navbar />
      <div className="container px-4 py-6 max-w-3xl">
        {event && (
          <>
            <EventCard event={event} showFullContent />
            <EventComments
              eventUserId={event.userId}
              comments={comments}
              eventId={params.eventId}
            />
          </>
        )}
      </div>
    </main>
  );
};

export default EventDetailPage;
