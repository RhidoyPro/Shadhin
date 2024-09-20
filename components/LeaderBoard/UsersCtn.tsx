"use client";
import React, { useEffect, useState } from "react";
import UserAvatar from "../Shared/UserAvatar";
import VerifiedBadge from "../Shared/VerifiedBadge";
import { Award } from "lucide-react";
import { Prisma } from "@prisma/client";
import { fetchLeaderboard } from "@/actions/user";
import ClipLoader from "react-spinners/ClipLoader";
import { Button } from "../ui/button";

type LeaderBoardUser = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    image: true;
    points: true;
    role: true;
  };
}>;

const UsersCtn = ({ topUsers }: { topUsers: LeaderBoardUser[] }) => {
  const [users, setUsers] = useState<LeaderBoardUser[]>(topUsers);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = React.useState<boolean>(
    topUsers.length < 10 ? false : true
  );
  const [loadMore, setLoadMore] = React.useState<boolean>(false);

  const fetchUsers = async () => {
    const usersData = await fetchLeaderboard(page + 1);
    if (usersData?.length) {
      setPage(page + 1);
      setUsers([...users, ...usersData]);
      setLoadMore(false);
      return;
    }
    setHasMore(false);
    setLoadMore(false);
  };

  useEffect(() => {
    if (loadMore) {
      fetchUsers();
    }
  }, [loadMore]);

  return (
    <div>
      {users?.length ? (
        users?.map((user) => (
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
      {hasMore && (
        <Button
          variant="secondary"
          onClick={() => setLoadMore(true)}
          className="w-full"
        >
          {loadMore && <ClipLoader color="#fff" loading={loadMore} size={20} />}
          {loadMore ? "Loading ..." : "Load More"}
        </Button>
      )}
    </div>
  );
};

export default UsersCtn;
