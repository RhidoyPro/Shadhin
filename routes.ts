/**
 * An array of routes that are accessible to public users.
 * These routes don't require authentication.
 * @type {string[]}
 */

import BangladeshStates from "./data/bangladesh-states";

export const publicRoutes = ["/auth/error", "/verify-email", ,];

/**
 * An array of routes that are used for authentication
 * these will not be available to authenticated users.
 * @type {string[]}
 */

export const authRoutes = ["/login", "/signup", "/forgot-password"];

/**
 * An array of routes that are only available to admin users.
 * @type {string[]}
 */
export const adminRoutes = [
  "/admin",
  "/admin/users",
  "/admin/events",
  "/admin/reports",
];

/**
 * The prefix for the API authentication routes.
 * Routes that start with this prefix are used for authentication.
 * @type {string}
 */

export const apiAuthPrefix = "/api/auth";

/**
 * The default redirect path after a user logs in.
 * @type {string}
 */

export const DEFAULT_LOGIN_REDIRECT = `/events/${BangladeshStates[0].slug}`;
