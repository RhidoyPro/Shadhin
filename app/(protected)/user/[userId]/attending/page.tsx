import React from "react";
import { getUserById } from "@/data/user";
import { getEventsUserIsAttending } from "@/data/events";
import Link from "next/link";
import { formatDistance } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

const AttendingEventsPage = async ({
  params: { userId },
}: {
  params: { userId: string };
}) => {
  const user = await getUserById(userId);
  if (!user) notFound();

  const events = await getEventsUserIsAttending(userId, 100);

  return (
    <div className="container px-4 py-6 max-w-2xl">
      <Link
        href={`/user/${userId}`}
        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-primary mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to {user.name}&apos;s profile
      </Link>

      <div className="bg-white dark:bg-neutral-900 rounded-lg p-4">
        <h1 className="text-lg font-semibold text-primary mb-4">
          Events {user.name} is attending
        </h1>

        {!events || events.length === 0 ? (
          <p className="text-neutral-500 text-sm">Not attending any events.</p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/details/${event.id}`}
                className="block p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                <p className="text-sm text-primary line-clamp-3">
                  {event.content}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  {formatDistance(new Date(event.createdAt), new Date(), {
                    addSuffix: true,
                  })}
                  {" · "}
                  {event.stateName}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendingEventsPage;
