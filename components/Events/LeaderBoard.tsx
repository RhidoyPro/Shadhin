import { getTopUsers } from "@/data/user";
import React from "react";
import { Award, UserRound } from "lucide-react";
import { Separator } from "../ui/separator";
import UserAvatar from "../Shared/UserAvatar";
import VerifiedBadge from "../Shared/VerifiedBadge";
import { Button } from "../ui/button";
import Link from "next/link";

const LeaderBoard = async () => {
  const topUsers = await getTopUsers();
  return (
    <section className="hidden lg:block bg-white dark:bg-neutral-900 rounded-lg flex-[1.2] h-fit max-h-[80vh] overflow-y-auto custom-scrollbar sticky top-32 left-0 p-4">
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
      <Button variant={"secondary"} className="w-full mt-3" asChild>
        <Link href="/leaderboard">View More</Link>
      </Button>
    </section>
  );
};

export default LeaderBoard;
