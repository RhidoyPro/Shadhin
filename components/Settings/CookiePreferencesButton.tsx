"use client";

import { Button } from "@/components/ui/button";
import { resetConsent } from "@/lib/consent";

export default function CookiePreferencesButton() {
  return (
    <Button variant="outline" onClick={() => resetConsent()}>
      Manage Cookie Preferences
    </Button>
  );
}
