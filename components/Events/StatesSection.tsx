import BangladeshStates from "@/data/bangladesh-states";
import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";

type StatesSectionProps = {
  activeState: string;
};

const StatesSection = ({ activeState }: StatesSectionProps) => {
  return (
    <section className="bg-muted/50 border-b border-border sticky top-[57px] z-30 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1 px-3 py-2">
        {BangladeshStates.map((state) => (
          <Link
            href={`/events/${state.slug}`}
            key={state.id}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
              activeState === state.slug
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {state.name}
          </Link>
        ))}
      </div>
    </section>
  );
};

export default StatesSection;
