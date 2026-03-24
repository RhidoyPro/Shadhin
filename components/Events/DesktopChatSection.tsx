"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { ChatMessage } from "./ChatSection";
import { fetchMessages } from "@/actions/message";

const ChatSection = dynamic(() => import("./ChatSection"), {
  ssr: false,
});

type DesktopChatSectionProps = {
  activeState: string;
};

/**
 * Lazy wrapper that only mounts ChatSection on lg+ viewports.
 * On mobile (<1024px) the component tree is empty — no JS bundle,
 * no polling intervals, no hydration cost. Mobile users use the
 * dedicated /live-chat/[stateName] page instead.
 *
 * Messages are fetched client-side only on desktop, avoiding a
 * blocking DB query on the server for mobile users.
 */
const DesktopChatSection = ({ activeState }: DesktopChatSectionProps) => {
  const [isDesktop, setIsDesktop] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mql.matches);

    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // Fetch messages only on desktop
  useEffect(() => {
    if (!isDesktop) return;
    fetchMessages(activeState).then((msgs) => {
      if (msgs) setMessages(msgs);
    });
  }, [isDesktop, activeState]);

  if (!isDesktop) return null;

  return (
    <ChatSection
      activeState={activeState}
      savedMessages={messages}
    />
  );
};

export default DesktopChatSection;
