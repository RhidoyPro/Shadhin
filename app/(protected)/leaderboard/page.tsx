import React from "react";
import { Separator } from "@/components/ui/separator";
import { fetchLeaderboard } from "@/actions/user";
import UsersCtn from "@/components/LeaderBoard/UsersCtn";

const LeaderBoardPage = async () => {
  const topUsers = await fetchLeaderboard();
  return (
    <>
      <div className="container px-4 py-6 max-w-3xl">
        <div className="bg-white dark:bg-neutral-900 rounded-lg p-4">
          <h1 className="text-center text-xl font-bold text-primary">
            LeaderBoard 🏆
          </h1>
          <Separator className="my-3" />
          <UsersCtn topUsers={topUsers || []} />
        </div>
      </div>
    </>
  );
};

export default LeaderBoardPage;
