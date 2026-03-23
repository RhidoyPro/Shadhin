"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_MEASUREMENT_ID;

/**
 * Tracks route changes in the Next.js App Router.
 * Without this, GA4 only records the first page load.
 */
const RouteTracker = () => {
  const pathname = usePathname();

  useEffect(() => {
    if (!GA_ID || typeof window.gtag !== "function") return;
    window.gtag("config", GA_ID, { page_path: pathname });
  }, [pathname]);

  return null;
};

const GoogleAnalytics = () => {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            send_page_view: false,
            anonymize_ip: true
          });
        `}
      </Script>
      <RouteTracker />
    </>
  );
};

export default GoogleAnalytics;
