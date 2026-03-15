"use client";

import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function SearchInput({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      startTransition(() => {
        router.push(`/search?q=${encodeURIComponent(q)}`);
      });
    },
    [router]
  );

  return (
    <div className="relative">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
        size={16}
      />
      <Input
        autoFocus
        defaultValue={initialQuery}
        onChange={handleChange}
        placeholder="Search people, posts, events..."
        className="pl-9"
      />
    </div>
  );
}
