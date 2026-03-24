import React from "react";
import StatesSection from "@/components/Events/StatesSection";

export default function StateEventsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { stateName: string };
}) {
  return (
    <>
      <StatesSection activeState={params.stateName} />
      {children}
    </>
  );
}
