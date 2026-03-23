"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { ChatMessage } from "./ChatSection";

const ChatSection = dynamic(() => import("./ChatSection"), {
  ssr: false,
});

type DesktopChatSectionProps = {
  activeState: string;
  savedMessages: ChatMessage[];
};

/**
 * Lazy wrapper that only mounts ChatSection on lg+ viewports.
 * On mobile (<1024px) the component tree is empty — no JS bundle,
 * no polling intervals, no hydration cost. Mobile users use the
 * dedicated /live-chat/[stateName] page instead.
 */
const DesktopChatSection = ({
  activeState,
  savedMessages,
}: DesktopChatSectionProps) => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mql.matches);

    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  if (!isDesktop) return null;

  return (
    <ChatSection
      activeState={activeState}
      savedMessages={savedMessages}
    />
  );
};

export default DesktopChatSection;
