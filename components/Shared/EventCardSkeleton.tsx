import { Skeleton } from "@/components/ui/skeleton";

export const EventCardSkeleton = () => (
  <div className="p-4 space-y-3">
    {/* Avatar + name row */}
    <div className="flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>

    {/* Content lines — indented to align with text under avatar */}
    <div className="space-y-2 pl-[52px]">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-[85%]" />
      <Skeleton className="h-4 w-[60%]" />
    </div>

    {/* Action buttons row */}
    <div className="flex gap-3 pl-[52px] pt-1">
      <Skeleton className="h-8 w-[72px] rounded-lg" />
      <Skeleton className="h-8 w-[72px] rounded-lg" />
      <Skeleton className="h-8 w-[72px] rounded-lg" />
    </div>
  </div>
);
