import React from "react";
import Sidebar from "@/components/Admin/Sidebar";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="container flex gap-4 px-4 py-6 relative h-[90vh]">
      <Sidebar />
      <div className="h-full overflow-y-auto custom-scrollbar pr-4 bg-white dark:bg-neutral-900 rounded-md p-4 w-full">
        {children}
      </div>
    </div>
  );
}
