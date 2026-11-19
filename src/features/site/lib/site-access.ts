import { HOME_PATH } from "@features/landing/lib/landing-links";
import { PRIVACY_PATH } from "@features/visitors/lib/visitors-links";
import type { SiteMode } from "@shared/lib/site-mode";
import { SITE_OG_IMAGE_PATH } from "@shared/lib/metadata";

export type SiteAccess = "allow" | "redirectHome" | "notFound" | "methodNotAllowed";

export interface SiteRequest {
  method: string;
  pathname: string;
}

export const READ_METHODS = ["GET", "HEAD"];

const HEALTH_PATH = "/api/health";

const API_PREFIX = "/api/";

// The images that stand administrators upload live in the volume, not in public/, and the landing shows them.
const UPLOADED_GAME_IMAGES_PREFIX = "/api/media/games/";

// The landing-only mode serves these pages; the Docker HEALTHCHECK needs /api/health.
// The metadata routes the landing needs: crawlers read robots and the sitemap, and the share card is its og:image.
const METADATA_PATHS = ["/robots.txt", "/sitemap.xml", SITE_OG_IMAGE_PATH];

const LANDING_ONLY_PATHS = new Set([HOME_PATH, PRIVACY_PATH, HEALTH_PATH, ...METADATA_PATHS]);

// Folders of public/ whose files the landing shows. A file name elsewhere could still reach a page or a Route Handler.
const PUBLIC_ASSET_FOLDERS = ["/games/", "/sponsors/", "/media/", "/icons/"];

// The kinds of file public/ holds. Anything else with a dot (".rsc", ".json") could be read by Next as a page.
const PUBLIC_FILE_EXTENSION = /\.(?:avif|ico|jpe?g|js|mp4|png|svg|webm|webmanifest|webp)$/i;

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
  return LANDING_ONLY_PATHS.has(pathname) || isPublicFile(pathname) || pathname.startsWith(UPLOADED_GAME_IMAGES_PREFIX);
}

function isPublicFile(pathname: string): boolean {
  if (!PUBLIC_FILE_EXTENSION.test(pathname)) return false;

  const isAtRoot = pathname.lastIndexOf("/") === 0;

  return isAtRoot || PUBLIC_ASSET_FOLDERS.some((folder) => pathname.startsWith(folder));
}
