import type { VisitorListParams, VisitorSort } from "@features/visitors/lib/types";

export const VISITORS_PAGE_SIZE = 50;

const QUERY_MAX_LENGTH = 120;

const MAX_PAGE = 100_000;

type SearchValue = string | string[] | undefined;

/** The `?q=&page=&sort=` of the list and of its CSV: anything unreadable falls back to the default. */
export function parseVisitorListParams(raw: {
  q?: SearchValue;
  page?: SearchValue;
  sort?: SearchValue;
}): VisitorListParams {
  return {
    query: firstValue(raw.q).trim().slice(0, QUERY_MAX_LENGTH),
    page: parsePage(firstValue(raw.page)),
    sort: parseSort(firstValue(raw.sort)),
  };
}

function firstValue(value: SearchValue): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function parsePage(value: string): number {
  const page = Number(value);

  return /^\d+$/.test(value) && Number.isSafeInteger(page) && page >= 1 && page <= MAX_PAGE ? page : 1;
}

function parseSort(value: string): VisitorSort {
  return value === "oldest" ? "oldest" : "newest";
}

/** The link of a page of the list that keeps the search and the sort; the first page has no `page`. */
export function buildListHref(basePath: string, params: VisitorListParams, page: number): string {
  const search = new URLSearchParams(buildExportQuery(params));

  if (page > 1) search.set("page", String(page));

  const query = search.toString();

  return query ? `${basePath}?${query}` : basePath;
}

/** The `?q=&sort=` that the list and its CSV share. Newest first is the default, so it is left out. */
export function buildExportQuery(params: VisitorListParams): string {
  const search = new URLSearchParams();

  if (params.query) search.set("q", params.query);

  if (params.sort === "oldest") search.set("sort", "oldest");

  return search.toString();
}
