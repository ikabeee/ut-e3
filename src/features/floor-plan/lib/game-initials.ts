/** Short words that carry no meaning for the initials of a game name. */
const CONNECTOR_WORDS: ReadonlySet<string> = new Set(["de", "del", "la", "el", "los", "las", "y", "em"]);

/** The initials of a game without a cover: "Sombra del Mictlán" becomes "SM". */
export function gameInitials(name: string): string {
  const words = name.split(/[^\p{L}]+/u).filter((word) => word.length > 0);
  const significant = words.filter((word) => !CONNECTOR_WORDS.has(word.toLowerCase()));
  const picks = significant.length > 0 ? significant : words;

  if (picks.length === 0) return "";

  if (picks.length === 1) return picks[0].slice(0, 2).toUpperCase();

  return `${picks[0].charAt(0)}${picks[picks.length - 1].charAt(0)}`.toUpperCase();
}
