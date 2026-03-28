"use client";

import { createContext, useContext, useCallback } from "react";
import type bnMessages from "@/messages/bn.json";

type Messages = typeof bnMessages;
type Namespace = keyof Messages;

interface I18nContextValue {
  locale: string;
  messages: Messages;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: Messages;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ locale, messages }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useLocale(): string {
  const ctx = useContext(I18nContext);
  return ctx?.locale || "bn";
}

export function useTranslations(namespace: Namespace) {
  const ctx = useContext(I18nContext);
  const ns = ctx?.messages?.[namespace] as Record<string, string> | undefined;

  return useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value = ns?.[key] || key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          value = value.replace(`{${k}}`, String(v));
        }
      }
      return value;
    },
    [ns]
  );
}
