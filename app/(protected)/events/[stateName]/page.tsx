import React, { Suspense } from "react";
import type { Metadata } from "next";
import DesktopChatSection from "@/components/Events/DesktopChatSection";
import FeedSection from "@/components/Events/FeedSection";
import LeaderBoard from "@/components/Events/LeaderBoard";
import { Button } from "@/components/ui/button";
import { MessageCircleMoreIcon } from "lucide-react";
import Link from "next/link";
import { fetchEvents } from "@/actions/event";
import BangladeshStates from "@/data/bangladesh-states";
import { Skeleton } from "@/components/ui/skeleton";

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
  // Only fetch events eagerly — messages are deferred to DesktopChatSection
  const events = await fetchEvents(params.stateName);
  return (
    <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left — Leaderboard (streamed independently) */}
          <aside className="lg:col-span-3">
            <Suspense fallback={
              <div className="hidden lg:block rounded-xl border border-border bg-card p-4 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            }>
              <LeaderBoard />
            </Suspense>
          </aside>

          {/* Center — Feed */}
          <main className="lg:col-span-6">
            <FeedSection activeState={params.stateName} initialEvents={events} />
          </main>

          {/* Right — Live Chat (lazy-loaded, desktop only) */}
          <aside className="lg:col-span-3">
            <DesktopChatSection
              activeState={params.stateName}
            />
          </aside>
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
    </div>
  );
};

export default StateEventsPage;
