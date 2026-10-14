import "server-only";

export {
  AUTH_COOKIE_MAX_AGE_SECONDS,
  AUTH_COOKIE_NAME,
  clearAuthSession,
  decodeSessionCookie,
  getAuthCookieOptions,
  getAuthSession,
  saveAuthSession,
} from "@shared/lib/server/session";
