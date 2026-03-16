import Navbar from "@/components/Navbar";
import React from "react";

const ProtectedLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <main className="bg-background min-h-screen relative">
      <Navbar />
      {children}
    </main>
  );
};

export default ProtectedLayout;
