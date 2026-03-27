"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { getConsent, setConsent, CONSENT_VERSION } from "@/lib/consent";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Shield, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

export default function CookieConsent() {
  const t = useTranslations("cookie");
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analyticsOn, setAnalyticsOn] = useState(true);
  const [marketingOn, setMarketingOn] = useState(true);

  useEffect(() => {
    const consent = getConsent();
    // Show banner if no consent or outdated version
    if (!consent || consent.version < CONSENT_VERSION) {
      setVisible(true);
    }

    // Listen for reset (from settings page)
    const showHandler = () => {
      setVisible(true);
      setExpanded(false);
      setAnalyticsOn(true);
      setMarketingOn(true);
    };
    window.addEventListener("shadhin:show-consent", showHandler);
    return () => window.removeEventListener("shadhin:show-consent", showHandler);
  }, []);

  if (!visible) return null;

  const handleAcceptAll = () => {
    setConsent({ analytics: true, marketing: true });
    setVisible(false);
  };

  const handleRejectNonEssential = () => {
    setConsent({ analytics: false, marketing: false });
    setVisible(false);
  };

  const handleSavePreferences = () => {
    setConsent({ analytics: analyticsOn, marketing: marketingOn });
    setVisible(false);
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 pb-safe">
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-card shadow-lg">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                {t("message")}{" "}
                <Link href="/privacy" className="underline text-primary">
                  {t("privacyPolicy")}
                </Link>
              </p>

              {!expanded && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={handleAcceptAll}>
                    {t("acceptAll")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRejectNonEssential}
                  >
                    {t("rejectNonEssential")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setExpanded(true)}
                  >
                    {t("manage")}
                    <ChevronDown className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {expanded && (
                <div className="mt-3 space-y-3">
                  {/* Essential — always on */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{t("essential")}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("essentialDesc")}
                      </p>
                    </div>
                    <Switch checked disabled />
                  </div>

                  {/* Analytics */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{t("analytics")}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("analyticsDesc")}
                      </p>
                    </div>
                    <Switch
                      checked={analyticsOn}
                      onCheckedChange={setAnalyticsOn}
                    />
                  </div>

                  {/* Marketing */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{t("marketing")}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("marketingDesc")}
                      </p>
                    </div>
                    <Switch
                      checked={marketingOn}
                      onCheckedChange={setMarketingOn}
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={handleSavePreferences}>
                      {t("savePreferences")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpanded(false)}
                    >
                      <ChevronUp className="mr-1 h-3.5 w-3.5" />
                      {t("less")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
