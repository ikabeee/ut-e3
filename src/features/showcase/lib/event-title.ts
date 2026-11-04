import type { ShowcaseTitle } from "@features/showcase/lib/types";

/** Splits the event name at its first space: "PIXEL & CODE" becomes "PIXEL" and "& CODE". */
export function splitEventTitle(name: string): ShowcaseTitle {
  const trimmed = name.trim();
  const splitAt = trimmed.indexOf(" ");

  if (splitAt === -1) {
    return { firstLine: trimmed, secondLine: "" };
  }

  return { firstLine: trimmed.slice(0, splitAt), secondLine: trimmed.slice(splitAt + 1).trim() };
}
