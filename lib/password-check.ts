import { pwnedPassword } from "hibp";

/**
 * Check if a password has been exposed in known data breaches
 * using the HaveIBeenPwned Pwned Passwords API (k-anonymity model).
 * Returns the number of times the password appeared in breaches, or 0 if safe.
 */
export async function checkBreachedPassword(password: string): Promise<number> {
  try {
    const count = await pwnedPassword(password);
    return count;
  } catch {
    // If the API is unreachable, fail open — don't block registration
    return 0;
  }
}

/**
 * Validate password is not breached. Returns error string or null if safe.
 */
export async function validatePasswordNotBreached(
  password: string
): Promise<string | null> {
  const breachCount = await checkBreachedPassword(password);
  if (breachCount > 0) {
    return `This password has appeared in ${breachCount.toLocaleString()} data breaches. Please choose a different password.`;
  }
  return null;
}
