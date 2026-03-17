import Navbar from "@/components/Navbar";
import { auth } from "@/auth";
import { getUserNotifications } from "@/data/notifications";
import PushPermissionPrompt from "@/components/Shared/PushPermissionPrompt";
import React from "react";

const ProtectedLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const session = await auth();
  const userNotifications = await getUserNotifications(session?.user?.id!);
  return (
    <main className="bg-background min-h-screen relative">
      <Navbar session={session} userNotifications={userNotifications || []} />
      {children}
      <PushPermissionPrompt />
    </main>
  );
};

export default ProtectedLayout;
