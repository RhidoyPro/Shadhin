"use client";
import React, { useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Send, Radio, X } from "lucide-react";
import { toast } from "sonner";
import { addMessage } from "@/actions/message";
import { Prisma } from "@prisma/client";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type ChatMessage = Prisma.MessageGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        image: true;
      };
    };
  };
}>;

type ChatSectionProps = {
  activeState: string;
  savedMessages: ChatMessage[];
  hiddenOnMobile?: boolean;
};

const POLL_INTERVAL = 4000; // 4 seconds

const ChatSection = ({
  activeState,
  savedMessages,
  hiddenOnMobile = true,
}: ChatSectionProps) => {
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>(savedMessages);
  const [message, setMessage] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [loadPrevious, setLoadPrevious] = React.useState(false);
  const [autoScroll, setAutoScroll] = React.useState(true);

  // Initialize with saved messages
  useEffect(() => {
    if (savedMessages.length < 20) setHasMore(false);
    setMessages(savedMessages);
  }, [savedMessages]);

  // Poll for new messages
  useEffect(() => {
    const poll = async () => {
      try {
        const lastMessage = messages[messages.length - 1];
        const after = lastMessage ? new Date(lastMessage.createdAt).toISOString() : "";
        const params = new URLSearchParams({ stateName: activeState });
        if (after) params.set("after", after);

        const res = await fetch(`/api/chat/messages?${params}`);
        if (!res.ok) return;

        const newMessages: ChatMessage[] = await res.json();
        if (newMessages.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const unique = newMessages.filter((m) => !existingIds.has(m.id));
            return unique.length > 0 ? [...prev, ...unique] : prev;
          });
        }
      } catch {
        // Silently fail — next poll will retry
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [activeState, messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && !loadPrevious) {
      chatBoxRef.current?.scrollTo(0, chatBoxRef.current?.scrollHeight);
    }
  }, [messages, autoScroll, loadPrevious]);

  const sendMessageHandler = async () => {
    if (message.trim() === "") return toast.error("Message cannot be empty");
    const text = message;
    setMessage("");
    const res = await addMessage(text, activeState);
    if (res.error) {
      toast.error(res.error);
      setMessage(text); // restore on error
    }
    // Polling will pick up the new message
  };

  const fetchPaginatedMessages = useCallback(async () => {
    try {
      const { fetchMessages } = await import("@/actions/message");
      const prevMessages = await fetchMessages(activeState, page + 1);
      if (prevMessages?.length) {
        setPage(page + 1);
        setMessages((prev) => [...prevMessages, ...prev]);
        setAutoScroll(false);
      } else {
        setHasMore(false);
      }
    } finally {
      setLoadPrevious(false);
    }
  }, [activeState, page]);

  useEffect(() => {
    if (loadPrevious) {
      setAutoScroll(false);
      fetchPaginatedMessages();
    }
  }, [loadPrevious, fetchPaginatedMessages]);

  return (
    <section
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card overflow-hidden sticky top-[120px]",
        hiddenOnMobile ? "hidden lg:flex h-[520px]" : "flex h-[91vh]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/5 to-transparent border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Radio className="h-4 w-4 text-primary" />
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
          </div>
          <div>
            <h2 className="font-semibold text-foreground text-sm">Live Chat</h2>
            <p className="text-[11px] text-muted-foreground capitalize">{activeState.replace("-", " ")}</p>
          </div>
        </div>
        {!hiddenOnMobile && (
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
            <Link href={`/events/${activeState}`}>
              <X className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar" ref={chatBoxRef}>
        {hasMore && (
          <div className="flex justify-center">
            <Button variant="link" size="sm" className="text-xs" onClick={() => setLoadPrevious(true)}>
              Load previous messages
            </Button>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-2">
            <Avatar className="h-6 w-6 shrink-0 mt-0.5">
              <AvatarImage src={msg?.user?.image || undefined} alt={msg?.user?.name || ""} />
              <AvatarFallback className="bg-primary/10 text-[9px] text-primary">
                {msg?.user?.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Link href={`/user/${msg?.user?.id}`} className="text-[11px] font-medium text-foreground hover:underline">
                  {msg?.user?.name}
                </Link>
              </div>
              <p className="text-[13px] leading-relaxed text-muted-foreground break-words">
                {msg.message}
              </p>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">No messages yet. Say hi!</p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 bg-muted/20 shrink-0">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessageHandler()}
            className="flex-1 h-9 rounded-full border-0 bg-muted/50 text-sm focus-visible:ring-1 focus-visible:ring-primary"
          />
          <Button
            size="icon"
            onClick={sendMessageHandler}
            disabled={!message.trim()}
            className="h-8 w-8 shrink-0 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-30"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ChatSection;
