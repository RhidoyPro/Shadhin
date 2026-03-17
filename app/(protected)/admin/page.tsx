import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getAdminStats } from "@/data/stats";
import {
  BadgeAlertIcon,
  CalendarCheck2,
  HeartIcon,
  LoaderIcon,
  MessageCircleIcon,
  MessageCircleMoreIcon,
  PersonStandingIcon,
  Users,
  ArrowRightIcon,
  MailXIcon,
} from "lucide-react";
import Link from "next/link";

const DashboardPage = async () => {
  const stats = await getAdminStats();

  const userCards = [
    {
      label: "Total Users",
      value: stats.users,
      description: "Registered accounts",
      icon: Users,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
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
      value: stats.events,
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
      value: stats.reports,
      description: "Submitted user reports",
      icon: BadgeAlertIcon,
      color: "bg-red-500/10 text-red-600 dark:text-red-400",
    },
  ];

  const engagementCards = [
    {
      label: "Likes",
      value: stats.likes,
      description: "Total reactions",
      icon: HeartIcon,
      color: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    },
    {
      label: "Comments",
      value: stats.comments,
      description: "Total comments posted",
      icon: MessageCircleIcon,
      color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    {
      label: "Messages",
      value: stats.totalMessages,
      description: "Chat messages sent",
      icon: MessageCircleMoreIcon,
      color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    },
  ];

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
  ];

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

      {/* Quick Links */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Quick Links
        </h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ElementType;
  color: string;
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
      </CardContent>
    </Card>
  );
}

export default DashboardPage;
