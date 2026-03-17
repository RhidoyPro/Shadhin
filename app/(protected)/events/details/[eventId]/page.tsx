import React from "react";
import type { Metadata } from "next";
import EventComments from "@/components/EventsDetail/EventComments";
import { fetchEventComments } from "@/actions/comment";
import EventData from "@/components/EventsDetail/EventData";
import { fetchEventById } from "@/actions/event";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: { eventId: string };
}): Promise<Metadata> {
  const event = await fetchEventById(params.eventId);
  if (!event) return { title: "Post Not Found" };
  const snippet = event.content.slice(0, 120) + (event.content.length > 120 ? "..." : "");
  return {
    title: `${event.user.name}'s Post`,
    description: snippet,
  };
}

const EventDetailPage = async ({ params }: { params: { eventId: string } }) => {
  const event = await fetchEventById(params.eventId);
  const comments = await fetchEventComments(params.eventId);

  return (
    <div className="container px-4 py-8 max-w-2xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to feed
      </Link>

      {event && (
        <div className="space-y-6">
          <EventData event={event} />
          <EventComments
            eventUserId={event.userId}
            comments={comments || []}
            eventId={params.eventId}
          />
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;
