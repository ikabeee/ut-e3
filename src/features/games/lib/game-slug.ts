const FALLBACK_SLUG = "juego";

/** The URL name of a game: lower case, without accents, with hyphens between words. */
export function buildGameSlug(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .join("-");

  return slug || FALLBACK_SLUG;
}

/** The first slug that is not taken: `base`, then `base-2`, `base-3`... */
export function pickFreeSlug(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base;

  let suffix = 2;

  while (taken.has(`${base}-${suffix}`)) suffix += 1;

  return `${base}-${suffix}`;
}
