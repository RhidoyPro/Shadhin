export type ConsentCategory = "essential" | "analytics" | "marketing";

export type ConsentState = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: number;
};

const STORAGE_KEY = "shadhin_consent";
const COOKIE_NAME = "shadhin_consent_given";
export const CONSENT_VERSION = 1;

export function getConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentState;
  } catch {
    return null;
  }
}

export function setConsent(
  partial: Pick<ConsentState, "analytics" | "marketing">
): void {
  const state: ConsentState = {
    essential: true,
    analytics: partial.analytics,
    marketing: partial.marketing,
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

  // Set a minimal cookie so server can read consent status if needed
  const flags = `a=${state.analytics ? 1 : 0}&m=${state.marketing ? 1 : 0}`;
  document.cookie = `${COOKIE_NAME}=${flags};path=/;max-age=${365 * 86400};SameSite=Lax`;

  window.dispatchEvent(new CustomEvent("shadhin:consent-updated"));
}

export function hasConsent(category: ConsentCategory): boolean {
  if (category === "essential") return true;
  const consent = getConsent();
  if (!consent) return false;
  return consent[category];
}

export function resetConsent(): void {
  localStorage.removeItem(STORAGE_KEY);
  document.cookie = `${COOKIE_NAME}=;path=/;max-age=0`;
  window.dispatchEvent(new CustomEvent("shadhin:show-consent"));
}
