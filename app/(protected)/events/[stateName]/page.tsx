import React from "react";
import ChatSection from "@/components/Events/ChatSection";
import FeedSection from "@/components/Events/FeedSection";
import LeaderBoard from "@/components/Events/LeaderBoard";
import StatesSection from "@/components/Events/StatesSection";
import { Button } from "@/components/ui/button";
import { MessageCircleMoreIcon } from "lucide-react";
import Link from "next/link";
import { fetchEvents } from "@/actions/event";
import { fetchMessages } from "@/actions/message";

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
      <div className="container flex flex-col sm:flex-row gap-4 px-4 py-6 relative">
        <LeaderBoard />
        <FeedSection activeState={params.stateName} initialEvents={events} />
        <ChatSection
          activeState={params.stateName}
          savedMessages={eventMessages || []}
        />
      </div>
      <Button
        className="md:hidden fixed bottom-6 right-6 rounded-full px-4"
        asChild
      >
        <Link href={`/live-chat/${params.stateName}`}>
          <MessageCircleMoreIcon size={24} className="mr-1" />
          Live Chat
        </Link>
      </Button>
    </>
  );
};

export default StateEventsPage;
