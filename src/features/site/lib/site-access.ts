import { HOME_PATH } from "@features/landing/lib/landing-links";
import { PRIVACY_PATH } from "@features/visitors/lib/visitors-links";
import type { SiteMode } from "@shared/lib/site-mode";

export type SiteAccess = "allow" | "redirectHome" | "notFound" | "methodNotAllowed";

export interface SiteRequest {
  method: string;
  pathname: string;
}

export const READ_METHODS = ["GET", "HEAD"];

const HEALTH_PATH = "/api/health";

const API_PREFIX = "/api/";

// The landing-only mode serves these pages; the Docker HEALTHCHECK needs /api/health.
const LANDING_ONLY_PATHS = new Set([HOME_PATH, PRIVACY_PATH, HEALTH_PATH]);

// Folders of public/ whose files the landing shows. A file name elsewhere could still reach a page or a Route Handler.
const PUBLIC_ASSET_FOLDERS = ["/games/", "/sponsors/", "/media/", "/icons/"];

/**
 * Decides what the kill switch does with a request. In `landing` mode only reads of the landing, its public files and
 * the health check pass: every write is refused, which also closes the Server Actions (a POST to any page).
 */
export function decideSiteAccess(mode: SiteMode, request: SiteRequest): SiteAccess {
  if (mode === "full") return "allow";

  if (!READ_METHODS.includes(request.method)) return "methodNotAllowed";

  if (isLandingOnlyPath(request.pathname)) return "allow";

  return request.pathname.startsWith(API_PREFIX) ? "notFound" : "redirectHome";
}

function isLandingOnlyPath(pathname: string): boolean {
  return LANDING_ONLY_PATHS.has(pathname) || isPublicFile(pathname);
}

function isPublicFile(pathname: string): boolean {
  if (!hasFileExtension(pathname)) return false;

  const isAtRoot = pathname.lastIndexOf("/") === 0;

  return isAtRoot || PUBLIC_ASSET_FOLDERS.some((folder) => pathname.startsWith(folder));
}

function hasFileExtension(pathname: string): boolean {
  return /\.[a-z0-9]+$/i.test(pathname.slice(pathname.lastIndexOf("/") + 1));
}
