import React from "react";
import { getMessagesByStateName } from "@/data/messages";
import ChatSection from "@/components/Events/ChatSection";

const LiveChatPage = async ({ params }: { params: { stateName: string } }) => {
  const eventMessages = await getMessagesByStateName(params.stateName);
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
