import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

const SUPPORTED_LOCALES = ["bn", "en"];

export default getRequestConfig(async () => {
  let locale = "bn";

  try {
    const cookieStore = cookies();
    const saved = cookieStore.get("locale")?.value;
    if (saved && SUPPORTED_LOCALES.includes(saved)) {
      locale = saved;
    }
  } catch {
    // cookies() not available in some build contexts
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
