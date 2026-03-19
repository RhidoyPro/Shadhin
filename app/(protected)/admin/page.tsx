import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getAdminStats } from "@/data/stats";
import {
  BadgeAlertIcon,
  BadgeCheck,
  BotIcon,
  CalendarCheck2,
  HeartIcon,
  LoaderIcon,
  MapPinIcon,
  MessageCircleIcon,
  MessageCircleMoreIcon,
  MegaphoneIcon,
  PersonStandingIcon,
  ShieldBanIcon,
  Ticket,
  Users,
  UserCheckIcon,
  ArrowRightIcon,
  MailXIcon,
  ActivityIcon,
  ClipboardListIcon,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import BangladeshStates from "@/data/bangladesh-states";

const DashboardPage = async () => {
  const stats = await getAdminStats();

  const userCards = [
    {
      label: "Total Users",
      value: stats.users.total,
      today: stats.users.today,
      thisWeek: stats.users.thisWeek,
      description: "Registered accounts",
      icon: Users,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Real Users",
      value: stats.realUsers,
      description: "Excluding bots",
      icon: UserCheckIcon,
      color: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    },
    {
      label: "Bot Accounts",
      value: stats.bots,
      description: "Automated/test accounts",
      icon: BotIcon,
      color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    },
    {
      label: "Suspended",
      value: stats.suspended,
      description: "Currently suspended users",
      icon: ShieldBanIcon,
      color: "bg-red-500/10 text-red-600 dark:text-red-400",
    },
    {
      label: "Pending Verifications",
      value: stats.pendingVerifications,
      description: "Awaiting email verification",
      icon: LoaderIcon,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      label: "No Email Sent",
      value: stats.pendingVerificationsWithNoEmailSent,
      description: "Verification email not delivered",
      icon: MailXIcon,
      color: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    },
  ];

  const contentCards = [
    {
      label: "Total Events",
      value: stats.events.total,
      today: stats.events.today,
      thisWeek: stats.events.thisWeek,
      description: "Published events",
      icon: CalendarCheck2,
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      label: "Event Attendees",
      value: stats.attendees,
      description: "Total RSVPs across events",
      icon: PersonStandingIcon,
      color: "bg-lime-500/10 text-lime-600 dark:text-lime-400",
    },
    {
      label: "Reports",
      value: stats.reports.total,
      today: stats.reports.today,
      thisWeek: stats.reports.thisWeek,
      description: "Submitted user reports",
      icon: BadgeAlertIcon,
      color: "bg-red-500/10 text-red-600 dark:text-red-400",
    },
  ];

  const engagementCards = [
    {
      label: "Likes",
      value: stats.likes.total,
      today: stats.likes.today,
      thisWeek: stats.likes.thisWeek,
      description: "Total reactions",
      icon: HeartIcon,
      color: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    },
    {
      label: "Comments",
      value: stats.comments.total,
      today: stats.comments.today,
      thisWeek: stats.comments.thisWeek,
      description: "Total comments posted",
      icon: MessageCircleIcon,
      color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    {
      label: "Messages",
      value: stats.messages.total,
      today: stats.messages.today,
      thisWeek: stats.messages.thisWeek,
      description: "Chat messages sent",
      icon: MessageCircleMoreIcon,
      color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    },
  ];

  // Build district breakdown
  const districtMap = new Map<
    string,
    { users: number; events: number }
  >();
  const stateNames = BangladeshStates.filter((s) => s.slug !== "all-districts");
  for (const state of stateNames) {
    districtMap.set(state.slug, { users: 0, events: 0 });
  }
  for (const d of stats.districts.users) {
    if (d.stateName) {
      const existing = districtMap.get(d.stateName);
      if (existing) existing.users = d._count;
      else districtMap.set(d.stateName, { users: d._count, events: 0 });
    }
  }
  for (const d of stats.districts.events) {
    const existing = districtMap.get(d.stateName);
    if (existing) existing.events = d._count;
    else districtMap.set(d.stateName, { users: 0, events: d._count });
  }
  const districtBreakdown = Array.from(districtMap.entries())
    .map(([slug, data]) => {
      const state = stateNames.find((s) => s.slug === slug);
      return {
        name: state?.name || slug,
        slug,
        users: data.users,
        events: data.events,
        active: data.users > 0 || data.events > 0,
      };
    })
    .sort((a, b) => b.users - a.users);

  const activeDistricts = districtBreakdown.filter((d) => d.active).length;
  const deadDistricts = districtBreakdown.filter((d) => !d.active).length;

  const quickLinks = [
    {
      label: "Manage Users",
      href: "/admin/users",
      description: "View and manage user accounts",
      icon: Users,
    },
    {
      label: "Manage Events",
      href: "/admin/events",
      description: "Review and moderate events",
      icon: CalendarCheck2,
    },
    {
      label: "View Reports",
      href: "/admin/reports",
      description: "Handle submitted reports",
      icon: BadgeAlertIcon,
    },
    {
      label: "Broadcast",
      href: "/admin/broadcast",
      description: "Send announcements to all users",
      icon: MegaphoneIcon,
    },
    {
      label: "Audit Log",
      href: "/admin/audit-log",
      description: "Track all admin actions",
      icon: ClipboardListIcon,
    },
    {
      label: "Promotion Requests",
      href: "/admin/promotions",
      description: "Review post boost requests",
      icon: MegaphoneIcon,
    },
    {
      label: "Org Verification",
      href: "/admin/org-verification",
      description: "Approve verified badge applications",
      icon: BadgeCheck,
    },
    {
      label: "Ticket Requests",
      href: "/admin/tickets",
      description: "Approve event ticket purchases",
      icon: Ticket,
    },
  ];

  // Merge recent activity into a single timeline
  const timeline = [
    ...stats.recentActivity.users.map((u) => ({
      type: "signup" as const,
      label: `${u.name}${u.isBot ? " (bot)" : ""} joined`,
      detail: u.stateName || "No district",
      time: u.createdAt,
      href: `/user/${u.id}`,
    })),
    ...stats.recentActivity.events.map((e) => ({
      type: "event" as const,
      label: `${e.user.name} posted`,
      detail:
        e.content.length > 60 ? e.content.slice(0, 57) + "..." : e.content,
      time: e.createdAt,
      href: `/events/details/${e.id}`,
    })),
    ...stats.recentActivity.reports.map((r) => ({
      type: "report" as const,
      label: `${r.user.name} reported`,
      detail:
        r.reason.length > 60 ? r.reason.slice(0, 57) + "..." : r.reason,
      time: r.createdAt,
      href: "/admin/reports",
    })),
  ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 15);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your platform activity and metrics.
        </p>
      </div>

      {/* Users Section */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Users
        </h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {userCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      </section>

      {/* Content Section */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Content
        </h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {contentCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      </section>

      {/* Engagement Section */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Engagement
        </h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {engagementCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      </section>

      <Separator />

      {/* District Breakdown */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            District Breakdown
          </h2>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {activeDistricts} active
            </span>
            <span className="text-red-500 font-medium">
              {deadDistricts} inactive
            </span>
          </div>
        </div>
        <Card className="rounded-xl border border-border bg-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">District</th>
                    <th className="px-4 py-3 font-medium text-right">Users</th>
                    <th className="px-4 py-3 font-medium text-right">Events</th>
                    <th className="px-4 py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {districtBreakdown.map((d) => (
                    <tr
                      key={d.slug}
                      className="border-b last:border-0 hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-4 py-2.5 font-medium">{d.name}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {d.users.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {d.events.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            d.active
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {d.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Recent Activity */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <ActivityIcon className="h-3.5 w-3.5" />
          Recent Activity
        </h2>
        <Card className="rounded-xl border border-border bg-card">
          <CardContent className="p-0">
            <div className="divide-y">
              {timeline.length === 0 && (
                <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                  No recent activity.
                </p>
              )}
              {timeline.map((item, i) => (
                <div
                  key={`${item.type}-${i}`}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-accent/30 transition-colors"
                >
                  <div
                    className={`mt-0.5 rounded-full p-1.5 ${
                      item.type === "signup"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : item.type === "event"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-red-500/10 text-red-500"
                    }`}
                  >
                    {item.type === "signup" ? (
                      <Users className="h-3.5 w-3.5" />
                    ) : item.type === "event" ? (
                      <CalendarCheck2 className="h-3.5 w-3.5" />
                    ) : (
                      <BadgeAlertIcon className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.detail}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(item.time, { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Quick Links */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Quick Links
        </h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer group">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <link.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{link.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {link.description}
                    </p>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  color,
  today,
  thisWeek,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ElementType;
  color: string;
  today?: number;
  thisWeek?: number;
}) {
  return (
    <Card className="rounded-xl border border-border bg-card">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {label}
            </p>
            <p className="text-3xl font-bold tracking-tight">
              {value.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className={`rounded-lg p-2.5 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {(today !== undefined || thisWeek !== undefined) && (
          <div className="mt-3 flex gap-3 border-t pt-2.5">
            {today !== undefined && (
              <span className="text-xs text-muted-foreground">
                Today:{" "}
                <span className="font-semibold text-foreground">
                  {today.toLocaleString()}
                </span>
              </span>
            )}
            {thisWeek !== undefined && (
              <span className="text-xs text-muted-foreground">
                This week:{" "}
                <span className="font-semibold text-foreground">
                  {thisWeek.toLocaleString()}
                </span>
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DashboardPage;
