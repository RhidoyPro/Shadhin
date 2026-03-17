import React from "react";
import Sidebar from "@/components/Admin/Sidebar";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="container flex h-[calc(100vh-4rem)] px-0 py-0 md:py-4 md:px-4">
      <Sidebar />
      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
