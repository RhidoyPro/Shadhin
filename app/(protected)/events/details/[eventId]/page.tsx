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

  const snippet =
    event.content.slice(0, 155) + (event.content.length > 155 ? "..." : "");
  const title = `${event.user.name} on Shadhin.io`;
  const baseUrl = process.env.FRONTEND_URL || "https://shadhin.io";
  const postUrl = `${baseUrl}/events/details/${event.id}`;
  const ogImage =
    event.type === "image" && event.mediaUrl
      ? event.mediaUrl
      : `${baseUrl}/og-default.png`;

  return {
    title,
    description: snippet,
    openGraph: {
      title,
      description: snippet,
      url: postUrl,
      type: "article",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      siteName: "Shadhin.io",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: snippet,
      images: [ogImage],
    },
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

      {event ? (
        <div className="space-y-6">
          <EventData event={event} />
          <EventComments
            eventUserId={event.userId}
            comments={comments || []}
            eventId={params.eventId}
          />
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium mb-1">Post not found</p>
          <p className="text-sm">This post may have been deleted.</p>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;
