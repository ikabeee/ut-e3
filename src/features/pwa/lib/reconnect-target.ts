const FROM_PARAM = "from";

/**
 * Where /offline goes when the network returns: the page the visitor was trying to open (the worker leaves it in
 * `?from=`) or, without it, `fallback`. Only a path of this site is accepted, so the link cannot send anyone elsewhere.
 */
export function resolveReconnectTarget({ search, fallback }: { search: string; fallback: string }): string {
  const from = new URLSearchParams(search).get(FROM_PARAM);

  return from !== null && isSitePath(from) ? from : fallback;
}

function isSitePath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\");
}
