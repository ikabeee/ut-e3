import "server-only";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { parseSponsorInput, type SponsorInput } from "@features/sponsors/lib/sponsor-input";
import { INITIAL_SPONSORS } from "@features/sponsors/lib/server/sponsors-seed";
import type { Sponsor } from "@features/sponsors/lib/types";
import type { PrismaClient } from "@generated/prisma/client";

export interface SponsorBackfillResult {
  /** Names of the sponsors it inserted. */
  added: string[];
  /** One entry per existing sponsor it completed: `Name (field, field)`. */
  filled: string[];
}

const FILLABLE_FIELDS = ["websiteUrl", "phone", "email", "services"] as const;

type FillableField = (typeof FILLABLE_FIELDS)[number];

/**
 * Brings a database that already has its sponsors up to the initial list (the seed only fills an empty table). A
 * sponsor is matched by name without regard to case: if it is missing it is inserted after the last position, and if
 * it exists only its empty fields (website, phone, email, services) are filled, so a value the sysadmin edited is
 * never overwritten. Every entry is validated like the admin form (and its logo must exist in public/) before anything
 * is written. Safe to run again: a second run changes nothing.
 */
export async function backfillSponsors(
  prisma: PrismaClient,
  entries: readonly Sponsor[] = INITIAL_SPONSORS,
): Promise<SponsorBackfillResult> {
  const validated = entries.map(validateEntry);
  const rows = await prisma.sponsor.findMany();
  const result: SponsorBackfillResult = { added: [], filled: [] };
  let lastPosition = Math.max(0, ...rows.map(({ position }) => position));

  for (const entry of validated) {
    const existing = rows.find(({ name }) => sameName(name, entry.name));

    if (existing) {
      const filled = await fillEmptyFields(prisma, existing, entry);

      if (filled.length > 0) result.filled.push(`${existing.name} (${filled.join(", ")})`);
      continue;
    }

    lastPosition += 1;
    await prisma.sponsor.create({ data: { ...entry, position: lastPosition } });
    result.added.push(entry.name);
  }

  return result;
}

function validateEntry(entry: Sponsor): SponsorInput {
  const form = new FormData();

  for (const [field, value] of Object.entries(entry)) form.set(field, value === null ? "" : String(value));

  const parsed = parseSponsorInput(form);

  if (!parsed.isValid)
    throw new Error(`Patrocinador inválido (${entry.name}): ${Object.keys(parsed.errors).join(", ")}`);

  if (!existsSync(join(process.cwd(), "public", parsed.sponsor.logoPath)))
    throw new Error(`Patrocinador inválido (${entry.name}): no existe public${parsed.sponsor.logoPath}`);

  return parsed.sponsor;
}

async function fillEmptyFields(
  prisma: PrismaClient,
  existing: Record<FillableField, string | null> & { id: string },
  entry: SponsorInput,
): Promise<FillableField[]> {
  const fields = FILLABLE_FIELDS.filter((field) => isEmpty(existing[field]) && !isEmpty(entry[field]));

  if (fields.length > 0)
    await prisma.sponsor.update({
      where: { id: existing.id },
      data: Object.fromEntries(fields.map((field) => [field, entry[field]])),
    });

  return [...fields];
}

function isEmpty(value: string | null): boolean {
  return value === null || value.trim() === "";
}

function sameName(first: string, second: string): boolean {
  return first.trim().toLowerCase() === second.trim().toLowerCase();
}
