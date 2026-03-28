import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export default getRequestConfig(async ({ locale: explicitLocale }) => {
  let locale = explicitLocale || "bn";

  if (!explicitLocale) {
    try {
      const cookieStore = cookies();
      locale = cookieStore.get("locale")?.value || "bn";
    } catch {
      // cookies() may not be available in some contexts
    }
  }

  // Validate locale
  if (locale !== "bn" && locale !== "en") {
    locale = "bn";
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
