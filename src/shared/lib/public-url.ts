import { parseSiteUrl } from "@shared/lib/env";

/**
 * The absolute URL of a redirect to `path`. Behind a proxy or a tunnel the request carries the internal origin
 * (http://localhost:3000), which the phone of the visitor cannot reach, so the public origin of the site wins: the one
 * the emails use (NEXT_PUBLIC_SITE_URL). Without it, or with a value that is not a usable URL, the request decides, as
 * it always did.
 */
export function buildPublicUrl(path: string, requestUrl: string | URL): URL {
  return new URL(path, readPublicOrigin() ?? requestUrl);
}

function readPublicOrigin(): string | null {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configured) return null;

  try {
    return parseSiteUrl(configured, process.env.NODE_ENV);
  } catch {
    // A broken value must not take every redirect of the site down with it: the build already refuses it.
    return null;
  }
}
