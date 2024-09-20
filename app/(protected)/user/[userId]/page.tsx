import React from "react";
import { getUserById } from "@/data/user";
import { getUserEvents } from "@/data/events";
import EventCard from "@/components/Shared/EventCard";
import UploadCard from "@/components/Events/UploadCard";
import UserInfo from "@/components/Profile/UserInfo";
import { auth } from "@/auth";

const UserProfilePage = async ({
  params: { userId },
}: {
  params: { userId: string };
}) => {
  const session = await auth();
  const user = await getUserById(userId);
  const events = await getUserEvents(userId);
  return (
    <>
      {user && (
        <div className="container flex flex-col md:flex-row gap-4 px-4 py-6 relative">
          <UserInfo user={user} eventsCreated={events?.length || 0} />
          <section className="flex-[2.5] flex flex-col gap-3">
            {session?.user?.id === user.id && <UploadCard />}
            {events?.length ? (
              events.map((event) => <EventCard key={event.id} event={event} />)
            ) : (
              <p className="text-center text-lg text-gray-600 mt-4">
                There are no events for{" "}
                <span className="text-gray-800 font-semibold capitalize">
                  {user.name}
                </span>
              </p>
            )}
          </section>
        </div>
      )}
    </>
  );
};

export default UserProfilePage;
