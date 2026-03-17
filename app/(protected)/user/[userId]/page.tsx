import React from "react";
import type { Metadata } from "next";
import { getUserById } from "@/data/user";
import UploadCard from "@/components/Events/UploadCard";
import UserInfo from "@/components/Profile/UserInfo";
import { auth } from "@/auth";
import { fetchUserEvents } from "@/actions/event";
import EventsCtn from "@/components/Profile/EventsCtn";
import { Separator } from "@/components/ui/separator";

export async function generateMetadata({
  params: { userId },
}: {
  params: { userId: string };
}): Promise<Metadata> {
  const user = await getUserById(userId);
  if (!user) return { title: "User Not Found" };
  return {
    title: `${user.name} — Profile`,
    description: user.bio || `Check out ${user.name}'s profile and posts on Shadhin.io.`,
  };
}

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
        <div className="container max-w-6xl mx-auto flex flex-col md:flex-row gap-6 px-4 py-6 relative">
          <div className="w-full md:w-[380px] shrink-0">
            <UserInfo user={user} eventsCreated={events?.length || 0} />
          </div>
          <Separator orientation="vertical" className="hidden md:block h-auto self-stretch" />
          <section className="flex-1 min-w-0 flex flex-col gap-4">
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
