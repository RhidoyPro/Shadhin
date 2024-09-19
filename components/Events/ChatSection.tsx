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
import { addMessage } from "@/actions/message";
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
    setMessages(savedMessages);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedMessages]);

  useEffect(() => {
    chatBoxRef.current?.scrollTo(0, chatBoxRef.current?.scrollHeight);
  }, [messages]);

  return (
    <section
      className={`${
        hiddenOnMobile
          ? "hidden md:flex h-[79vh] flex-[1.3] sticky top-32 left-0"
          : "flex h-full flex-1"
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
