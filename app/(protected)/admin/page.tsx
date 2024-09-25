import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";

const DashboardPage = async () => {
  const stats = await getAdminStats();
  return (
    <div>
      <h1 className="text-3xl font-semibold text-primary">Dashboard</h1>
      <div className="grid gap-4 grid-cols-3 mt-4">
        <Card className="bg-emerald-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-6 w-6text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.users}</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <CalendarCheck2 className="h-6 w-6text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.events}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <BadgeAlertIcon className="h-6 w-6text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.reports}</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending User Verifications
            </CardTitle>
            <LoaderIcon className="h-6 w-6text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              +{stats.pendingVerifications}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <HeartIcon className="h-6 w-6text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.likes}</div>
          </CardContent>
        </Card>
        <Card className="bg-stone-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Comments
            </CardTitle>
            <MessageCircleIcon className="h-6 w-6text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.comments}</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Messages
            </CardTitle>
            <MessageCircleMoreIcon className="h-6 w-6text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.totalMessages}</div>
          </CardContent>
        </Card>
        <Card className="bg-lime-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Number of Attendees
            </CardTitle>
            <PersonStandingIcon className="h-6 w-6text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.attendees}</div>
          </CardContent>
        </Card>
      </div>
      {/* Please select an option from the sidebar to view more details. */}
      <div className="mt-4">
        <p className="text-muted-foreground">
          Please select an option from the sidebar to view more details.
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;
