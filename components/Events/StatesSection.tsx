"use client";

import BangladeshStates from "@/data/bangladesh-states";
import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/I18nProvider";

type StatesSectionProps = {
  activeState: string;
};

const StatesSection = ({ activeState }: StatesSectionProps) => {
  const locale = useLocale();
  return (
    <section className="bg-muted/50 border-b border-border sticky top-[57px] z-30">
      <div className="flex items-center px-2 py-2">
        {BangladeshStates.map((state) => (
          <Link
            href={`/events/${state.slug}`}
            key={state.id}
            className={cn(
              "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors whitespace-nowrap text-center",
              activeState === state.slug
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            {locale === "bn" ? state.nameBn : state.name}
          </Link>
        ))}
      </div>
    </section>
  );
};

export default StatesSection;
