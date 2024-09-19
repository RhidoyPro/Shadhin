import React from "react";
import UserAvatar from "../Shared/UserAvatar";
import { User } from "@prisma/client";
import { auth } from "@/auth";
import { getEventsUserIsAttending } from "@/data/events";
import { format } from "date-fns";
import ProfileUpdate from "./ProfileUpdate";
import VerifiedBadge from "../Shared/VerifiedBadge";

type UserInfoProps = {
  user: User;
  eventsCreated: number;
};

const UserInfo = async ({ user, eventsCreated }: UserInfoProps) => {
  const session = await auth();

  const attendingEvents = await getEventsUserIsAttending(user.id);

  return (
    <section className="rounded-lg flex-1 h-fit max-h-[80vh] overflow-y-auto custom-scrollbar md:sticky top-24 left-0">
      <div className="bg-white dark:bg-neutral-900 p-4">
        <div className="flex items-center gap-3">
          <UserAvatar size={14} image={user?.image || ""} id={user.id} />
          <div>
            <div className="flex items-center gap-1">
              <h1 className="text-2xl font-bold text-primary">{user.name}</h1>
              <VerifiedBadge userRole={user.role} />
            </div>
            <p className="text-neutral-500 dark:text-neutral-400">
              {user.email}
            </p>
          </div>
        </div>
        {session?.user?.id === user.id && <ProfileUpdate user={user} />}
      </div>
      <div className="bg-white dark:bg-neutral-900 p-4 mt-4">
        <h1 className="text-lg font-semibold text-primary">About</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2">
          University{" "}
          <span className="text-primary font-semibold">
            {user?.university || "-"}
          </span>
        </p>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2">
          Joined on{" "}
          <span className="text-primary font-semibold">
            {format(new Date(user.createdAt), "MMMM dd, yyyy")}
          </span>
        </p>
      </div>
      <div className="bg-white dark:bg-neutral-900 p-4 mt-4">
        <h1 className="text-lg font-semibold text-primary">Events</h1>
        <p className="text-neutral-500 dark:text-neutral-400 my-2">
          {user.name} has{" "}
          <span className="text-primary font-semibold">
            posted {eventsCreated}
          </span>{" "}
          events
        </p>
        <p className="text-neutral-500 dark:text-neutral-400">
          {user.name} is{" "}
          <span className="text-primary font-semibold">
            attending {attendingEvents?.length}
          </span>{" "}
          events
        </p>
      </div>
    </section>
  );
};

export default UserInfo;
