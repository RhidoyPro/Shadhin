import React from "react";
import EventComments from "@/components/EventsDetail/EventComments";
import { getEventById } from "@/data/events";
import { fetchEventComments } from "@/actions/comment";
import EventData from "@/components/EventsDetail/EventData";

const EventDetailPage = async ({ params }: { params: { eventId: string } }) => {
  const event = await getEventById(params.eventId);
  const comments = await fetchEventComments(params.eventId);

  return (
    <div className="container px-4 py-6 max-w-3xl">
      {event && (
        <>
          <EventData event={event} />
          <EventComments
            eventUserId={event.userId}
            comments={comments || []}
            eventId={params.eventId}
          />
        </>
      )}
    </div>
  );
};

export default EventDetailPage;
