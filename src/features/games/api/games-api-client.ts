import { getItchApiPath } from "@features/games/lib/games-links";
import { isItchLink, type ItchLink } from "@features/games/lib/itch-link";

/** The itch.io link of a game as the server decides it now, or `null` when the request fails (for example, offline). */
export async function fetchItchLink(slug: string): Promise<ItchLink | null> {
  try {
    const response = await fetch(getItchApiPath(slug), { cache: "no-store" });

    if (!response.ok) return null;

    const body = await response.json();

    return isItchLinkResponse(body) ? body.link : null;
  } catch {
    return null;
  }
}

function isItchLinkResponse(value: unknown): value is { link: ItchLink } {
  return typeof value === "object" && value !== null && "link" in value && isItchLink(value.link);
}
