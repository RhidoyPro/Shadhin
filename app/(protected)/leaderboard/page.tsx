import React from "react";
import Navbar from "@/components/Navbar";
import { Separator } from "@/components/ui/separator";
import { getAllUsersWithPoints } from "@/data/user";
import UserAvatar from "@/components/Shared/UserAvatar";
import VerifiedBadge from "@/components/Shared/VerifiedBadge";
import { Award } from "lucide-react";

const LeaderBoardPage = async () => {
  const topUsers = await getAllUsersWithPoints();
  return (
    <main className="bg-slate-100 dark:bg-neutral-700 min-h-screen relative">
      <Navbar />
      <div className="container px-4 py-6 max-w-3xl">
        <div className="bg-white dark:bg-neutral-900 rounded-lg p-4">
          <h1 className="text-center text-xl font-bold text-primary">
            LeaderBoard 🏆
          </h1>
          <Separator className="my-3" />
          <div>
            {topUsers?.length ? (
              topUsers?.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 my-3 bg-slate-100 dark:bg-neutral-700 rounded-md"
                >
                  <div className="flex items-center">
                    <UserAvatar image={user?.image || ""} id={user.id} />
                    <p className="ml-2">{user.name}</p>
                    <VerifiedBadge userRole={user.role} />
                  </div>
                  <p className="font-bold flex items-center gap-1 text-primary">
                    {user.points}
                    <Award />
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center">There are no users available</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default LeaderBoardPage;
