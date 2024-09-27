import React from "react";
import { getUserById } from "@/data/user";
import UploadCard from "@/components/Events/UploadCard";
import UserInfo from "@/components/Profile/UserInfo";
import { auth } from "@/auth";
import { fetchUserEvents } from "@/actions/event";
import EventsCtn from "@/components/Profile/EventsCtn";

const UserProfilePage = async ({
  params: { userId },
}: {
  params: { userId: string };
}) => {
  const session = await auth();
  const user = await getUserById(userId);
  const events = await fetchUserEvents(userId);
  return (
    <>
      {user && (
        <div className="container flex flex-col md:flex-row gap-4 px-4 py-6 relative">
          <UserInfo user={user} eventsCreated={events?.length || 0} />
          <section className="flex-[2.5] flex flex-col gap-3">
            {session?.user?.id === user.id && <UploadCard />}
            <EventsCtn
              initialEvents={events || []}
              username={user.name}
              userId={userId}
            />
          </section>
        </div>
      )}
    </>
  );
};

export default UserProfilePage;
