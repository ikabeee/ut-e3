import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Sponsor } from "@features/sponsors/lib/types";
import { INITIAL_SPONSORS } from "@features/sponsors/lib/server/sponsors-seed";

export const SPONSORS_CACHE_TAG = "sponsors";

export async function getSponsors(): Promise<Sponsor[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(SPONSORS_CACHE_TAG);

  return [...INITIAL_SPONSORS].sort(compareByPosition);
}

function compareByPosition(first: Sponsor, second: Sponsor): number {
  return first.position - second.position;
}
