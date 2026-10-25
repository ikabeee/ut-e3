import type { CSSProperties } from "react";

interface BeatOptions {
  at?: number;
  span?: number;
  from?: string;
  fromOpacity?: number;
  origin?: string;
  box?: "fill-box" | "view-box";
}

export function beatStyle({ at = 0, span = 1, from, fromOpacity, origin, box }: BeatOptions = {}): CSSProperties {
  // SAFETY: React applies custom properties from a style object, but CSSProperties does not list them.
  return {
    "--at": at,
    "--span": span,
    "--from": from,
    "--from-opacity": fromOpacity,
    "--origin": origin,
    "--box": box,
  } as CSSProperties;
}
