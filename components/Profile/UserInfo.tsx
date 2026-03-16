import React from "react";
import UserAvatar from "../Shared/UserAvatar";
import { User } from "@prisma/client";
import { auth } from "@/auth";
import {
  getEventsUserIsAttending,
  countEventsUserIsAttending,
} from "@/data/events";
import { getFollowCounts, isFollowing } from "@/data/user";
import { format, formatDistance } from "date-fns";
import ProfileUpdate from "./ProfileUpdate";
import VerifiedBadge from "../Shared/VerifiedBadge";
import FollowButton from "./FollowButton";
import Link from "next/link";

type UserInfoProps = {
  user: User;
  eventsCreated: number;
};

const UserInfo = async ({ user, eventsCreated }: UserInfoProps) => {
  const session = await auth();
  const isOwnProfile = session?.user?.id === user.id;

  const [attendingEvents, attendingCount, followCounts, userIsFollowing] =
    await Promise.all([
      getEventsUserIsAttending(user.id, 5),
      countEventsUserIsAttending(user.id),
      getFollowCounts(user.id),
      session?.user?.id && !isOwnProfile
        ? isFollowing(session.user.id, user.id)
        : Promise.resolve(false),
    ]);

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
        {isOwnProfile && <ProfileUpdate user={user} />}
        {!isOwnProfile && session?.user && (
          <FollowButton
            targetUserId={user.id}
            initialFollowing={userIsFollowing as boolean}
          />
        )}
      </div>

      {/* Follow counts */}
      <div className="bg-white dark:bg-neutral-900 p-4 mt-4 flex gap-6">
        <div className="text-center">
          <p className="text-primary font-bold text-lg">
            {followCounts.followers}
          </p>
          <p className="text-neutral-500 dark:text-neutral-300 text-sm">Followers</p>
        </div>
        <div className="text-center">
          <p className="text-primary font-bold text-lg">
            {followCounts.following}
          </p>
          <p className="text-neutral-500 dark:text-neutral-300 text-sm">Following</p>
        </div>
        <div className="text-center">
          <p className="text-primary font-bold text-lg">{eventsCreated}</p>
          <p className="text-neutral-500 dark:text-neutral-300 text-sm">Posts</p>
        </div>
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

      {/* Attending events list */}
      {attendingEvents && attendingEvents.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 p-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-primary">
              Attending ({attendingCount})
            </h1>
            {attendingCount > 5 && (
              <Link
                href={`/user/${user.id}/attending`}
                className="text-xs text-neutral-500 dark:text-neutral-300 hover:text-primary transition-colors"
              >
                View all
              </Link>
            )}
          </div>
          <div className="space-y-2">
            {attendingEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/details/${event.id}`}
                className="block p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <p className="text-sm text-primary line-clamp-2">
                  {event.content}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-300 mt-1">
                  {formatDistance(new Date(event.createdAt), new Date(), {
                    addSuffix: true,
                  })}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default UserInfo;
