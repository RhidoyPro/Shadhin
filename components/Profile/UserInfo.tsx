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
import {
  GraduationCap,
  CalendarDays,
  MapPin,
  Quote,
  CalendarCheck,
  ChevronRight,
} from "lucide-react";
import { Separator } from "../ui/separator";
import { getTranslations } from "next-intl/server";

type UserInfoProps = {
  user: User;
  eventsCreated: number;
};

const UserInfo = async ({ user, eventsCreated }: UserInfoProps) => {
  const t = await getTranslations("profile");
  const tc = await getTranslations("common");
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
    <section className="flex-1 h-fit max-h-[80vh] overflow-y-auto custom-scrollbar md:sticky top-24 left-0 space-y-4">
      {/* Hero Profile Header */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Gradient banner */}
        <div className="h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />

        {/* Avatar + Name */}
        <div className="flex flex-col items-center -mt-12 px-5 pb-5">
          <div className="ring-4 ring-background rounded-full">
            <UserAvatar size={20} image={user?.image || ""} id={user.id} />
          </div>

          <div className="flex items-center gap-1.5 mt-3">
            <h1 className="text-xl font-bold text-foreground">{user.name}</h1>
            <VerifiedBadge userRole={user.role} isVerifiedOrg={user.isVerifiedOrg} />
          </div>

          <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>

          {/* Action Button */}
          <div className="flex justify-center">
            {isOwnProfile && <ProfileUpdate user={user} />}
            {!isOwnProfile && session?.user && (
              <FollowButton
                targetUserId={user.id}
                initialFollowing={userIsFollowing as boolean}
              />
            )}
          </div>
        </div>

        <Separator />

        {/* Stats Row */}
        <div className="grid grid-cols-3 py-3">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">
              {followCounts.followers}
            </p>
            <p className="text-xs text-muted-foreground">{t("followers")}</p>
          </div>
          <div className="text-center border-x border-border">
            <p className="text-lg font-bold text-foreground">
              {followCounts.following}
            </p>
            <p className="text-xs text-muted-foreground">{t("following")}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{eventsCreated}</p>
            <p className="text-xs text-muted-foreground">{t("posts")}</p>
          </div>
        </div>
      </div>

      {/* About Card */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
          {t("about")}
        </h2>

        {user.bio && (
          <div className="flex gap-2 mb-4">
            <Quote className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              {user.bio}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("university")}</p>
              <p className="text-sm font-medium text-foreground">
                {user?.university || t("notSpecified")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
              <CalendarDays className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("joined")}</p>
              <p className="text-sm font-medium text-foreground">
                {format(new Date(user.createdAt), "MMMM dd, yyyy")}
              </p>
            </div>
          </div>

          {user.stateName && (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("district")}</p>
                <p className="text-sm font-medium text-foreground">
                  {user.stateName}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attending Events Card */}
      {attendingEvents && attendingEvents.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                {t("attending")}
              </h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {attendingCount}
              </span>
            </div>
            {attendingCount > 5 && (
              <Link
                href={`/user/${user.id}/attending`}
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
              >
                {tc("viewAll")}
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>
          <div className="space-y-1">
            {attendingEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/details/${event.id}`}
                className="block p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <p className="text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {event.content}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
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
