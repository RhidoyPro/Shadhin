"use client";

import { useState, useEffect } from "react";
import { hasConsent, type ConsentCategory } from "@/lib/consent";

export default function ConsentGate({
  category,
  children,
}: {
  category: ConsentCategory;
  children: React.ReactNode;
}) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = () => setAllowed(hasConsent(category));
    check();

    window.addEventListener("shadhin:consent-updated", check);
    return () => window.removeEventListener("shadhin:consent-updated", check);
  }, [category]);

  if (!allowed) return null;
  return <>{children}</>;
}
