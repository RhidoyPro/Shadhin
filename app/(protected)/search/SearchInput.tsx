"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { analytics } from "@/utils/analytics";
import { useTranslations } from "next-intl";

export default function SearchInput({ initialQuery }: { initialQuery: string }) {
  const t = useTranslations("search");
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      router.push(`/search?q=${encodeURIComponent(value)}`);
      if (value.trim()) {
        analytics.searchPerformed(value.length);
        analytics.searchQuery(value.trim(), 0);
      }
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, router]);

  return (
    <div className="relative group">
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
        size={18}
      />
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("placeholder")}
        className="h-12 pl-11 text-base rounded-xl border-border bg-card shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:shadow-md transition-shadow placeholder:text-muted-foreground/60"
      />
    </div>
  );
}
