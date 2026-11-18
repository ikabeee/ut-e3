import { useSearchParams } from "next/navigation";
import { KEYWORD_SEARCH_PARAM } from "@features/games/lib/games-links";

// The navbar search arrives as `?q=<text>`. The catalog only reads it and can clear it; like the genre, clearing
// pushes a history entry and Next.js syncs the URL with useSearchParams (linking-and-navigating.md). The URL is read
// again when clearing, so a genre chosen a moment before is kept.
export function useKeywordSearchParam() {
  const searchParams = useSearchParams();

  function clearKeyword() {
    const params = new URLSearchParams(window.location.search);

    params.delete(KEYWORD_SEARCH_PARAM);

    window.history.pushState(null, "", `${window.location.pathname}${toQueryString(params)}`);
  }

  return [searchParams.get(KEYWORD_SEARCH_PARAM) ?? "", clearKeyword] as const;
}

function toQueryString(params: URLSearchParams): string {
  const query = params.toString();

  return query === "" ? "" : `?${query}`;
}
