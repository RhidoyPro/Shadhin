import { cookies } from "next/headers";
import bnMessages from "@/messages/bn.json";
import enMessages from "@/messages/en.json";

type Messages = typeof bnMessages;
type Namespace = keyof Messages;

const messagesMap: Record<string, Messages> = { bn: bnMessages, en: enMessages };

export function getLocale(): string {
  try {
    const locale = cookies().get("locale")?.value;
    if (locale === "en") return "en";
  } catch {}
  return "bn";
}

export function getMessages(locale?: string): Messages {
  const l = locale || getLocale();
  return messagesMap[l] || bnMessages;
}

export function getTranslations(namespace: Namespace, locale?: string) {
  const messages = getMessages(locale);
  const ns = messages[namespace] as Record<string, string>;

  return function t(key: string, params?: Record<string, string | number>): string {
    let value = ns?.[key] || key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(`{${k}}`, String(v));
      }
    }
    return value;
  };
}
