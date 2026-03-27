import { getTopUsers } from "@/data/user";
import React from "react";
import { getTranslations } from "next-intl/server";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import VerifiedBadge from "../Shared/VerifiedBadge";
import Link from "next/link";
import { UserRole } from "@prisma/client";
import { cn } from "@/lib/utils";

function getRankStyle(rank: number) {
  if (rank === 1) return "bg-amber-500/15 text-amber-500 font-bold";
  if (rank === 2) return "bg-slate-400/15 text-slate-400 font-bold";
  if (rank === 3) return "bg-amber-700/15 text-amber-600 font-bold";
  return "bg-muted text-muted-foreground";
}

function TrendIndicator({ points, previousPoints }: { points: number; previousPoints: number }) {
  if (points > previousPoints) return <TrendingUp className="h-3 w-3 text-primary shrink-0" />;
  if (points < previousPoints) return <TrendingDown className="h-3 w-3 text-rose-500 shrink-0" />;
  return <Minus className="h-3 w-3 text-muted-foreground shrink-0" />;
}

const LeaderBoard = async () => {
  const t = await getTranslations("leaderboard");
  const topUsers = await getTopUsers();
  return (
    <section className="hidden lg:block rounded-xl border border-border bg-card overflow-hidden sticky top-[120px]">
      {/* Header */}
      <div className="flex items-center gap-2.5 p-4 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Trophy className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground text-sm">{t("title")}</h2>
          <p className="text-[11px] text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-border/50 animate-stagger">
        {topUsers?.length ? (
          topUsers.map((user, index) => {
            const rank = index + 1;
            return (
              <Link
                key={user.id}
                href={`/user/${user.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
              >
                {/* Rank */}
                <div className={cn("flex h-6 w-6 items-center justify-center rounded-md text-xs shrink-0", getRankStyle(rank))}>
                  {rank}
                </div>

                {/* Avatar */}
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                    {user.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground flex items-center gap-1">
                    {user.name}
                    <VerifiedBadge userRole={user.role as UserRole} isVerifiedOrg={user.isVerifiedOrg} />
                  </p>
                </div>

                {/* Trend + Points */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <TrendIndicator points={user.points} previousPoints={user.previousPoints} />
                  <span className="text-xs font-medium text-foreground tabular-nums">
                    {user.points.toLocaleString()}
                  </span>
                </div>
              </Link>
            );
          })
        ) : (
          <p className="text-center text-sm text-muted-foreground py-6">{t("noUsers")}</p>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-3">
        <Link
          href="/leaderboard"
          className="block w-full text-center text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {t("viewFull")}
        </Link>
      </div>
    </section>
  );
};

export default LeaderBoard;
