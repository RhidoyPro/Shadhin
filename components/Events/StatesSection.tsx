import BangladeshStates from "@/data/bangladesh-states";
import Link from "next/link";
import React from "react";

type StatesSectionProps = {
  activeState: string;
};

const StatesSection = ({ activeState }: StatesSectionProps) => {
  return (
    <section className="bg-primary flex items-center justify-between gap-4 py-3 px-4 sm:px-10 sticky top-[72px] left-0 z-50 overflow-x-auto no-scrollbar">
      {BangladeshStates.map((state) => (
        <Link
          href={`/events/${state.slug}`}
          key={state.id}
          className={`text-white uppercase font-medium text-sm transition-all duration-300 ease-in-out hover:text-slate-100 ${
            activeState === state.slug ? "border-b-2 border-white" : ""
          }`}
        >
          {state.name}
        </Link>
      ))}
    </section>
  );
};

export default StatesSection;
