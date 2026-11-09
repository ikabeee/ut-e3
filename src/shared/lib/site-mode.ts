/**
 * How much of the site a deployment serves: `landing` is the kill switch (only the landing page, docs/deploy.md) and
 * `full` is the whole app. Read once from SITE_MODE, both while building (the landing hides the links it cannot use)
 * and while running (src/proxy.ts blocks the rest), so the build and the server must get the same value.
 */
export type SiteMode = "landing" | "full";

const SITE_MODES: readonly SiteMode[] = ["landing", "full"];

export function parseSiteMode(value: string | undefined, nodeEnv: string | undefined): SiteMode {
  const mode = value?.trim();

  // Fails closed: a production server nobody configured shows only the landing.
  if (!mode) return nodeEnv === "production" ? "landing" : "full";

  if (!isSiteMode(mode)) {
    throw new Error(`SITE_MODE debe ser "landing" o "full". Valor recibido: "${mode}".`);
  }

  return mode;
}

function isSiteMode(value: string): value is SiteMode {
  return SITE_MODES.some((mode) => mode === value);
}

export const siteMode: SiteMode = parseSiteMode(process.env.SITE_MODE, process.env.NODE_ENV);
