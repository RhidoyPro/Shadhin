"use client";
import React, { useEffect } from "react";
import { Separator } from "../ui/separator";
import CurrentUserAvatar from "../Shared/CurrentUserAvatar";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { SendIcon, XIcon } from "lucide-react";
import UserAvatar from "../Shared/UserAvatar";
import VerifiedBadge from "../Shared/VerifiedBadge";
import { IMessage, useSocket } from "@/context/SocketProvider";
import { toast } from "sonner";
import { addMessage, fetchMessages } from "@/actions/message";
import { Prisma } from "@prisma/client";
import Link from "next/link";

type ChatSectionProps = {
  activeState: string;
  savedMessages: Prisma.MessageGetPayload<{
    include: {
      user: {
        select: {
          id: true;
          name: true;
          image: true;
        };
      };
    };
  }>[];
  hiddenOnMobile?: boolean;
};

const ChatSection = ({
  activeState,
  savedMessages,
  hiddenOnMobile = true,
}: ChatSectionProps) => {
  const chatBoxRef = React.useRef<HTMLDivElement>(null);

  const { setStateName, messages, sendMessage, setMessages } = useSocket();
  const [message, setMessage] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [loadPrevious, setLoadPrevious] = React.useState(false);

  useEffect(() => {
    setStateName(activeState);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeState]);

  const sendMessageHandler = () => {
    if (message.trim() === "") return toast.error("Message cannot be empty");
    addMessage(message, activeState);
    sendMessage(message);
    setMessage("");
  };

  useEffect(() => {
    if (savedMessages.length < 20) {
      setHasMore(false);
    }
    setMessages(savedMessages);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedMessages]);

  useEffect(() => {
    if (loadPrevious) return;
    chatBoxRef.current?.scrollTo(0, chatBoxRef.current?.scrollHeight);
  }, [messages]);

  const fetchPaginatedMessages = async () => {
    const prevMessages = await fetchMessages(activeState, page + 1);
    if (prevMessages?.length) {
      setPage(page + 1);
      setMessages([...prevMessages, ...messages]);
      setLoadPrevious(false);
      return;
    }
    setLoadPrevious(false);
    setHasMore(false);
  };

  useEffect(() => {
    if (loadPrevious) {
      fetchPaginatedMessages();
    }
  }, [loadPrevious]);

  return (
    <section
      className={`${
        hiddenOnMobile
          ? "hidden md:flex h-[79vh] flex-[1.3] sticky top-32 left-0"
          : "flex h-[91vh] flex-1"
      } flex-col bg-white dark:bg-neutral-900 rounded-lg  p-4`}
    >
      <div
        className={`flex items-center ${
          hiddenOnMobile ? "justify-center" : "justify-between"
        }`}
      >
        <h1 className="text-center text-2xl font-bold text-primary">
          Live Chat - <span className="capitalize">{activeState}</span>
        </h1>
        {!hiddenOnMobile && (
          <Button variant={"ghost"} size={"iconRounded"} asChild>
            <Link href={`/events/${activeState}`}>
              <XIcon />
            </Link>
          </Button>
        )}
      </div>
      <Separator className="my-3" />
      <div className="flex-1 relative">
        <div
          className={`overflow-y-auto ${
            hiddenOnMobile ? "h-[60vh]" : "h-[70vh]"
          } custom-scrollbar`}
          ref={chatBoxRef}
        >
          {hasMore && (
            <div className="flex items-center justify-center">
              <Button variant={"link"} onClick={() => setLoadPrevious(true)}>
                Load previous messages
              </Button>
            </div>
          )}
          {messages.map((message: IMessage) => (
            <div key={message.id} className="flex my-2 gap-2">
              <UserAvatar
                size={8}
                image={message?.user?.image || ""}
                id={message?.user?.id}
              />
              <div>
                <div className="flex items-center gap-1">
                  <h1 className="text-sm font-semibold">
                    {message?.user?.name}
                  </h1>
                  <VerifiedBadge
                    userRole={
                      Number(message?.user?.id) % 2 === 0
                        ? "SUPER_USER"
                        : "USER"
                    }
                    size={4}
                  />
                </div>
                <p className="text-sm text-slate-400">{message.message}</p>
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-lg text-slate-400">No messages yet</p>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 w-full flex items-center gap-2">
          <CurrentUserAvatar />
          <Input
            placeholder="Type your message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessageHandler()}
          />
          <Button
            variant="ghost"
            size="iconRounded"
            onClick={sendMessageHandler}
          >
            <SendIcon />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ChatSection;
