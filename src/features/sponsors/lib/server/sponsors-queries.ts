import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Sponsor } from "@features/sponsors/lib/types";
import type { Prisma } from "@generated/prisma/client";
import { getPrisma } from "@shared/lib/server/prisma";

export const SPONSORS_CACHE_TAG = "sponsors";

// Selects exactly the fields of the Sponsor domain type, so a row needs no mapping.
const SPONSOR_FIELDS = {
  id: true,
  name: true,
  logoPath: true,
  websiteUrl: true,
  phone: true,
  services: true,
  position: true,
} satisfies Prisma.SponsorSelect;

export async function getSponsors(): Promise<Sponsor[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(SPONSORS_CACHE_TAG);

  const sponsors = await getPrisma().sponsor.findMany({ select: SPONSOR_FIELDS });

  return sponsors.toSorted(compareByPosition);
}

function compareByPosition(first: Sponsor, second: Sponsor): number {
  return first.position - second.position;
}
