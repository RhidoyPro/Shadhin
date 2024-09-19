import React from "react";
import { getMessagesByStateName } from "@/data/messages";
import ChatSection from "@/components/Events/ChatSection";
import Navbar from "@/components/Navbar";

const LiveChatPage = async ({ params }: { params: { stateName: string } }) => {
  const eventMessages = await getMessagesByStateName(params.stateName);
  return (
    <main className="bg-slate-100 dark:bg-neutral-700 h-screen relative flex flex-col justify-between">
      <Navbar />
      <ChatSection
        activeState={params.stateName}
        savedMessages={eventMessages || []}
        hiddenOnMobile={false}
      />
    </main>
  );
};

export default LiveChatPage;
