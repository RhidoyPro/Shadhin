"use client";

import { useTranslations } from "@/components/I18nProvider";
import { useTransition } from "react";
import { setLocale } from "@/actions/locale";
import { useRouter } from "next/navigation";

export default function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const t = useTranslations("settings");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleChange = (locale: string) => {
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
    });
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleChange("bn")}
        disabled={isPending}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          currentLocale === "bn"
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground hover:bg-accent"
        }`}
      >
        বাংলা
      </button>
      <button
        onClick={() => handleChange("en")}
        disabled={isPending}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          currentLocale === "en"
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground hover:bg-accent"
        }`}
      >
        English
      </button>
    </div>
  );
}
