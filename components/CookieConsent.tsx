"use client";

import { useState, useEffect } from "react";
import { getConsent, setConsent, CONSENT_VERSION } from "@/lib/consent";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Shield, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

export default function CookieConsent() {
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
                We use cookies to improve your experience and analyze usage.{" "}
                <Link href="/privacy" className="underline text-primary">
                  Privacy Policy
                </Link>
              </p>

              {!expanded && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={handleAcceptAll}>
                    Accept All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRejectNonEssential}
                  >
                    Reject Non-Essential
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setExpanded(true)}
                  >
                    Manage
                    <ChevronDown className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {expanded && (
                <div className="mt-3 space-y-3">
                  {/* Essential — always on */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Essential</p>
                      <p className="text-xs text-muted-foreground">
                        Authentication, security, core features
                      </p>
                    </div>
                    <Switch checked disabled />
                  </div>

                  {/* Analytics */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Analytics</p>
                      <p className="text-xs text-muted-foreground">
                        Google Analytics, Clarity, PostHog
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
                      <p className="text-sm font-medium">Marketing</p>
                      <p className="text-xs text-muted-foreground">
                        Meta Pixel for personalized ads
                      </p>
                    </div>
                    <Switch
                      checked={marketingOn}
                      onCheckedChange={setMarketingOn}
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={handleSavePreferences}>
                      Save Preferences
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpanded(false)}
                    >
                      <ChevronUp className="mr-1 h-3.5 w-3.5" />
                      Less
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
