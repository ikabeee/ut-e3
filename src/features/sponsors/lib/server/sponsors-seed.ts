import "server-only";
import type { Sponsor } from "@features/sponsors/lib/types";
import type { PrismaClient } from "@generated/prisma/client";

// No sponsor is confirmed yet. Frozen because nothing appends to it at runtime: it changes only by editing this file.
export const INITIAL_SPONSORS: readonly Sponsor[] = Object.freeze<Sponsor[]>([]);

// Sponsors have no natural key, so the seed only fills an empty table; the database assigns UUID ids.
export async function seedSponsors(prisma: PrismaClient): Promise<void> {
  if ((await prisma.sponsor.count()) > 0) return;

  await prisma.sponsor.createMany({ data: INITIAL_SPONSORS.map(toSponsorRow) });
}

function toSponsorRow({ name, logoPath, websiteUrl, phone, services, position }: Sponsor) {
  return { name, logoPath, websiteUrl, phone, services, position };
}
