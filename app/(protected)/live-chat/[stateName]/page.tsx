import React from "react";
import type { Metadata } from "next";
import ChatSection from "@/components/Events/ChatSection";
import { fetchMessages } from "@/actions/message";
import BangladeshStates from "@/data/bangladesh-states";

export async function generateMetadata({
  params,
}: {
  params: { stateName: string };
}): Promise<Metadata> {
  const state = BangladeshStates.find((s) => s.slug === params.stateName);
  const name = state?.name || params.stateName;
  return {
    title: `${name} — Live Chat`,
    description: `Join the live chat for ${name} district on Shadhin.io. Talk with your local community in real time.`,
  };
}

const LiveChatPage = async ({ params }: { params: { stateName: string } }) => {
  const eventMessages = await fetchMessages(params.stateName);
  return (
    <>
      <ChatSection
        activeState={params.stateName}
        savedMessages={eventMessages || []}
        hiddenOnMobile={false}
      />
    </>
  );
};

export default LiveChatPage;
