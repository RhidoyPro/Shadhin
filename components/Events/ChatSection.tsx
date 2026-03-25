"use client";
import React, { useEffect, useRef, useCallback, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Send, Radio, X, Reply, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addMessage } from "@/actions/message";
import { search } from "@/actions/search";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ChatUser = {
  id: string;
  name: string;
  image: string | null;
  isVerifiedOrg?: boolean;
};

type ReplyTo = {
  id: string;
  message: string;
  user: { id: string; name: string };
};

export type ChatMessage = {
  id: string;
  message: string;
  createdAt: Date | string;
  replyToId?: string | null;
  replyTo?: ReplyTo | null;
  user: ChatUser;
};

type ChatSectionProps = {
  activeState: string;
  savedMessages: ChatMessage[];
  hiddenOnMobile?: boolean;
};

const POLL_INTERVAL = 10000;

// Render text with @mentions highlighted
function renderWithMentions(text: string) {
  const mentionRegex = /@([\w][\w ]{0,30}?)(?=\s@|\s[^@\w]|[.,!?;:\n]|$)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <span key={match.index} className="font-semibold text-primary">
        @{match[1]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : text;
}

// Memoized message content to avoid re-running renderWithMentions regex on every render
const MemoizedMessageContent = React.memo(({ text }: { text: string }) => {
  const rendered = useMemo(() => renderWithMentions(text), [text]);
  return <>{rendered}</>;
});

const ChatSection = ({
  activeState,
  savedMessages,
  hiddenOnMobile = true,
}: ChatSectionProps) => {
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>(savedMessages);
  const [message, setMessage] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [loadPrevious, setLoadPrevious] = React.useState(false);
  const [autoScroll, setAutoScroll] = React.useState(true);
  const [isSending, setIsSending] = React.useState(false);

  // Reply state
  const [replyingTo, setReplyingTo] = React.useState<ChatMessage | null>(null);

  // Mention state
  const [mentionQuery, setMentionQuery] = React.useState("");
  const [showMentions, setShowMentions] = React.useState(false);
  const [mentionResults, setMentionResults] = React.useState<ChatUser[]>([]);
  const [mentionedUserIds, setMentionedUserIds] = React.useState<string[]>([]);
  const [mentionLoading, setMentionLoading] = React.useState(false);
  const [cursorPos, setCursorPos] = React.useState(0);

  // Initialize with saved messages
  useEffect(() => {
    if (savedMessages.length < 20) setHasMore(false);
    setMessages(savedMessages);
  }, [savedMessages]);

  // Poll for new messages (pauses when tab is hidden)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

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

    const startPolling = () => {
      if (!interval) {
        interval = setInterval(poll, POLL_INTERVAL);
      }
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        poll(); // Fetch immediately when tab becomes visible
        startPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeState, messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && !loadPrevious) {
      chatBoxRef.current?.scrollTo(0, chatBoxRef.current?.scrollHeight);
    }
  }, [messages, autoScroll, loadPrevious]);

  // Search users for @mention
  useEffect(() => {
    if (!mentionQuery || mentionQuery.length < 2) {
      setMentionResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setMentionLoading(true);
      try {
        const res = await search(mentionQuery);
        if (res && "users" in res && Array.isArray(res.users)) {
          setMentionResults(res.users.slice(0, 6) as ChatUser[]);
        }
      } catch {
        // ignore
      } finally {
        setMentionLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [mentionQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessage(val);

    const pos = e.target.selectionStart || 0;
    setCursorPos(pos);

    // Detect @mention
    const textBeforeCursor = val.slice(0, pos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery("");
    }
  };

  const handleMentionSelect = (user: ChatUser) => {
    const textBeforeCursor = message.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf("@");
    const before = message.slice(0, atIndex);
    const after = message.slice(cursorPos);
    const newText = `${before}@${user.name} ${after}`;
    setMessage(newText);
    setShowMentions(false);
    setMentionQuery("");
    if (!mentionedUserIds.includes(user.id)) {
      setMentionedUserIds((prev) => [...prev, user.id]);
    }
    inputRef.current?.focus();
  };

  const sendMessageHandler = async () => {
    if (message.trim() === "") return toast.error("Message cannot be empty");
    if (isSending) return;
    const text = message;
    const replyId = replyingTo?.id;
    const mentions = [...mentionedUserIds];
    setMessage("");
    setReplyingTo(null);
    setMentionedUserIds([]);
    setIsSending(true);
    try {
      const res = await addMessage(text, activeState, replyId, mentions.length > 0 ? mentions : undefined);
      if (res.error) {
        toast.error(res.error);
        setMessage(text);
      }
    } finally {
      setIsSending(false);
    }
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
          <div key={msg.id} className="group flex gap-2">
            <Avatar className="h-6 w-6 shrink-0 mt-0.5">
              <AvatarImage src={msg?.user?.image || undefined} alt={msg?.user?.name || ""} />
              <AvatarFallback className="bg-primary/10 text-[9px] text-primary">
                {msg?.user?.name?.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Link href={`/user/${msg?.user?.id}`} className="text-[11px] font-medium text-foreground hover:underline">
                  {msg?.user?.name}
                  {msg?.user?.isVerifiedOrg ? " ✓" : ""}
                </Link>
              </div>

              {/* Reply context */}
              {msg.replyTo && (
                <div className="flex items-center gap-1.5 mt-0.5 mb-1 pl-2 border-l-2 border-primary/40">
                  <span className="text-[10px] font-medium text-primary">{msg.replyTo.user.name}</span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[160px]">{msg.replyTo.message}</span>
                </div>
              )}

              <p className="text-[13px] leading-relaxed text-muted-foreground break-words">
                <MemoizedMessageContent text={msg.message} />
              </p>
            </div>

            {/* Reply button on hover */}
            <button
              onClick={() => {
                setReplyingTo(msg);
                inputRef.current?.focus();
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-center p-1 rounded hover:bg-muted"
              title="Reply"
            >
              <Reply className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">No messages yet. Say hi!</p>
          </div>
        )}
      </div>

      {/* Reply preview */}
      {replyingTo && (
        <div className="flex items-center gap-2 px-3 py-2 border-t border-border bg-muted/30 shrink-0">
          <Reply className="h-3.5 w-3.5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-medium text-primary">{replyingTo.user.name}</span>
            <p className="text-[11px] text-muted-foreground truncate">{replyingTo.message}</p>
          </div>
          <button onClick={() => setReplyingTo(null)} className="p-0.5 rounded hover:bg-muted">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-3 bg-muted/20 shrink-0 relative">
        {/* Mention suggestions dropdown */}
        {showMentions && mentionResults.length > 0 && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
            {mentionResults.map((u) => (
              <button
                key={u.id}
                onClick={() => handleMentionSelect(u)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted transition-colors text-sm"
              >
                <Avatar className="h-6 w-6 shrink-0">
                  <AvatarImage src={u.image || undefined} />
                  <AvatarFallback className="bg-primary/10 text-[9px] text-primary">
                    {u.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate font-medium text-foreground">{u.name}</span>
                {u.isVerifiedOrg && <span className="text-primary text-xs">✓</span>}
              </button>
            ))}
            {mentionLoading && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            placeholder="Type a message... (@ to mention)"
            value={message}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !showMentions) sendMessageHandler();
              if (e.key === "Escape") {
                setShowMentions(false);
                setReplyingTo(null);
              }
            }}
            className="flex-1 h-9 rounded-full border-0 bg-muted/50 text-sm focus-visible:ring-1 focus-visible:ring-primary"
          />
          <Button
            size="icon"
            onClick={sendMessageHandler}
            disabled={!message.trim() || isSending}
            className="h-8 w-8 shrink-0 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-30"
          >
            {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ChatSection;
