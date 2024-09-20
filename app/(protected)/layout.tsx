import Navbar from "@/components/Navbar";
import React from "react";

const ProtectedLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <main className="bg-slate-100 dark:bg-neutral-700 min-h-screen relative">
      <Navbar />
      {children}
    </main>
  );
};

export default ProtectedLayout;
