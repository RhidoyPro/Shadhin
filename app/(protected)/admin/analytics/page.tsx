import { getAnalyticsData } from "@/data/admin-analytics";
import { Card, CardContent } from "@/components/ui/card";
import { Users, FileText, Heart, MessageCircle } from "lucide-react";
import dynamic from "next/dynamic";

const AnalyticsCharts = dynamic(() => import("./charts"), {
  loading: () => (
    <div className="text-center py-10 text-sm text-muted-foreground">
      Loading charts...
    </div>
  ),
});

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const data = await getAnalyticsData(30);

  const kpiCards = [
    {
      label: "Total Users",
      value: data.kpis.totalUsers,
      icon: Users,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Total Posts",
      value: data.kpis.totalPosts,
      icon: FileText,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      label: "Total Likes",
      value: data.kpis.totalLikes,
      icon: Heart,
      color: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    },
    {
      label: "Total Comments",
      value: data.kpis.totalComments,
      icon: MessageCircle,
      color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Growth and engagement trends — last 30 days.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <Card key={card.label} className="rounded-xl border border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold tabular-nums">
                    {card.value.toLocaleString()}
                  </p>
                </div>
                <div className={`rounded-lg p-2.5 ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Summary */}
      <Card className="rounded-xl border border-border">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Revenue (Approved Requests)
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {data.revenue.tickets}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Ticket Sales
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {data.revenue.promotions}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Post Boosts
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {data.revenue.orgBadges}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Org Badges</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <AnalyticsCharts
        signups={data.signups}
        cumulativeSignups={data.cumulativeSignups}
        posts={data.posts}
        engagement={data.engagement}
      />
    </div>
  );
}
