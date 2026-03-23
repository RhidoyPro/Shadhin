import React from "react";
import type { Metadata } from "next";
import ChatSection from "@/components/Events/ChatSection";
import FeedSection from "@/components/Events/FeedSection";
import LeaderBoard from "@/components/Events/LeaderBoard";
import StatesSection from "@/components/Events/StatesSection";
import { Button } from "@/components/ui/button";
import { MessageCircleMoreIcon } from "lucide-react";
import Link from "next/link";
import { fetchEvents } from "@/actions/event";
import { fetchMessages } from "@/actions/message";
import BangladeshStates from "@/data/bangladesh-states";

export async function generateMetadata({
  params,
}: {
  params: { stateName: string };
}): Promise<Metadata> {
  const state = BangladeshStates.find((s) => s.slug === params.stateName);
  const name = state?.name || params.stateName;
  const title = `${name} — Events & Community`;
  const description = `See what's happening in ${name}. Local events, discussions, and community posts on Shadhin.io.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "Shadhin.io",
    },
  };
}

const StateEventsPage = async ({
  params,
}: {
  params: { stateName: string };
}) => {
  const eventMessages = await fetchMessages(params.stateName);
  const events = await fetchEvents(params.stateName);
  return (
    <>
      <StatesSection activeState={params.stateName} />
      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left — Leaderboard */}
          <aside className="lg:col-span-3">
            <LeaderBoard />
          </aside>

          {/* Center — Feed */}
          <main className="lg:col-span-6">
            <FeedSection activeState={params.stateName} initialEvents={events} />
          </main>

          {/* Right — Live Chat */}
          <aside className="lg:col-span-3">
            <ChatSection
              activeState={params.stateName}
              savedMessages={eventMessages || []}
            />
          </aside>
        </div>
      </div>

      {/* Mobile live chat button */}
      <Button
        className="lg:hidden fixed bottom-6 right-6 rounded-full px-4 shadow-lg shadow-primary/25"
        asChild
      >
        <Link href={`/live-chat/${params.stateName}`}>
          <MessageCircleMoreIcon size={20} className="mr-1.5" />
          Live Chat
        </Link>
      </Button>
    </>
  );
};

export default StateEventsPage;
