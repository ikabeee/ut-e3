import { useSearchParams } from "next/navigation";
import { GENRE_SEARCH_PARAM } from "@features/games/lib/games-links";

// The genre lives in `?genre=<slug>` so a filtered catalog can be shared and linked from a game page. pushState
// records each choice in history so Back returns to the unfiltered catalog, and Next.js syncs the URL with
// useSearchParams (linking-and-navigating.md).
export function useGenreSearchParam() {
  const searchParams = useSearchParams();

  function setGenreSlug(genreSlug: string | null) {
    const params = new URLSearchParams(searchParams.toString());

    if (genreSlug === null) {
      params.delete(GENRE_SEARCH_PARAM);
    } else {
      params.set(GENRE_SEARCH_PARAM, genreSlug);
    }

    window.history.pushState(null, "", `${window.location.pathname}${toQueryString(params)}`);
  }

  return [searchParams.get(GENRE_SEARCH_PARAM), setGenreSlug] as const;
}

function toQueryString(params: URLSearchParams): string {
  const query = params.toString();

  return query === "" ? "" : `?${query}`;
}
