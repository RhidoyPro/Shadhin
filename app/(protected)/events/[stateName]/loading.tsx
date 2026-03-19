import { Skeleton } from "@/components/ui/skeleton";
import { EventCardSkeleton } from "@/components/Shared/EventCardSkeleton";

const LeaderboardSkeleton = () => (
  <div className="hidden lg:block rounded-xl border border-border bg-card overflow-hidden sticky top-[120px]">
    <div className="flex items-center gap-2.5 p-4 border-b border-border">
      <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-36" />
      </div>
    </div>
    <div className="divide-y divide-border/50">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-6 w-6 rounded-md shrink-0" />
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-10 shrink-0" />
        </div>
      ))}
    </div>
    <div className="border-t border-border p-3">
      <Skeleton className="h-4 w-32 mx-auto" />
    </div>
  </div>
);

const UploadCardSkeleton = () => (
  <div className="p-4 border-b border-border/50">
    <div className="flex gap-3 items-center">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <Skeleton className="h-10 flex-1 rounded-full" />
    </div>
    <div className="flex gap-2 mt-3 pl-[52px]">
      <Skeleton className="h-8 w-20 rounded-lg" />
      <Skeleton className="h-8 w-20 rounded-lg" />
    </div>
  </div>
);

const FeedSkeleton = () => (
  <div className="rounded-xl border border-border bg-card overflow-hidden">
    <UploadCardSkeleton />
    <div className="divide-y divide-border/50">
      {Array.from({ length: 5 }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

const ChatSkeleton = () => (
  <div className="hidden lg:block rounded-xl border border-border bg-card overflow-hidden">
    <div className="flex items-center gap-2.5 p-4 border-b border-border">
      <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
    <div className="p-4 space-y-4 h-[400px]">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={`flex gap-2 ${i % 2 === 1 ? "flex-row-reverse" : ""}`}>
          <Skeleton className="h-7 w-7 rounded-full shrink-0" />
          <div className={`space-y-1 max-w-[70%] ${i % 2 === 1 ? "items-end" : ""}`}>
            <Skeleton className="h-3 w-16" />
            <Skeleton className={`h-8 w-${i % 3 === 0 ? "40" : i % 3 === 1 ? "32" : "48"} rounded-2xl`} />
          </div>
        </div>
      ))}
    </div>
    <div className="p-3 border-t border-border">
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  </div>
);

export default function EventsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6 mt-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <LeaderboardSkeleton />
        </aside>
        <main className="lg:col-span-6">
          <FeedSkeleton />
        </main>
        <aside className="lg:col-span-3">
          <ChatSkeleton />
        </aside>
      </div>
    </div>
  );
}
