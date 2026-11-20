import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import type { SponsorInput } from "@features/sponsors/lib/sponsor-input";
import { buildSponsorLogoUrl, readSponsorLogoFileName } from "@features/sponsors/lib/sponsor-logo";
import type { SponsorLogoFile } from "@features/sponsors/lib/server/sponsor-logo-upload";
import {
  removeSponsorLogo,
  sponsorLogoExists,
  storeSponsorLogo,
} from "@features/sponsors/lib/server/sponsor-logo-storage";
import type { Prisma } from "@generated/prisma/client";
import { recordAudit } from "@shared/lib/server/audit-log";
import { isCheckViolation } from "@shared/lib/server/database-errors";
import { getPrisma } from "@shared/lib/server/prisma";

export type SponsorWriteResult = { status: "saved" | "notFound" | "rejected" | "missingLogo" };

const ENTITY_TYPE = "sponsor";

/** Creates a sponsor, or changes it when `id` names one (RF-41). Each write leaves its entry in the audit log. */
export async function saveSponsor(actorId: string, id: string, sponsor: SponsorInput): Promise<SponsorWriteResult> {
  return saveSponsorWithLogo({ actorId, id, sponsor, logo: null });
}

/**
 * Saves a sponsor whose logo may be a file that the sysadmin uploaded (S3), already validated by the caller; the row
 * then points to it whatever `sponsor.logoPath` says. The file is written first, under a name with a hash of its
 * content, so it never overwrites the logo on show. Then the row changes in a transaction, together with its audit
 * entries. If the row is not written the new file goes away, and once it commits the file the sponsor used to show goes
 * away too, unless another sponsor still shows it. The logos of public/ are never deleted.
 */
export async function saveSponsorWithLogo(request: {
  actorId: string;
  id: string;
  sponsor: SponsorInput;
  logo: SponsorLogoFile | null;
}): Promise<SponsorWriteResult> {
  const { actorId, id, logo } = request;
  const sponsor = logo ? { ...request.sponsor, logoPath: buildSponsorLogoUrl(logo.fileName) } : request.sponsor;

  // The logos of public/ ship with the build and the uploaded ones live in the volume: a path with no file behind it
  // would show a broken image on the landing.
  if (!logo && !logoFileExists(sponsor.logoPath)) return { status: "missingLogo" };

  if (logo) await storeSponsorLogo(logo.fileName, logo.bytes);

  try {
    const written = await getPrisma().$transaction((transaction) =>
      writeIn(transaction, { actorId, id, sponsor, hasUpload: logo !== null }),
    );

    // Saved: the logo that was replaced may go. Not saved: the file that was just written has no row.
    await removeUnreferencedLogos(written.status === "saved" ? [written.previousPath] : uploadedPaths(sponsor, logo));

    return { status: written.status };
  } catch (cause) {
    await removeUnreferencedLogos(uploadedPaths(sponsor, logo));

    if (isCheckViolation(cause)) return { status: "rejected" };

    throw cause;
  }
}

export async function deleteSponsor(actorId: string, id: string): Promise<SponsorWriteResult> {
  const deleted = await getPrisma().$transaction(async (transaction): Promise<{ logoPath: string } | null> => {
    const sponsor = await transaction.sponsor.findUnique({ where: { id } });

    if (!sponsor) return null;

    await transaction.sponsor.delete({ where: { id } });
    await recordAudit(transaction, {
      actorId,
      action: "sponsor.delete",
      entityType: ENTITY_TYPE,
      entityId: id,
      detail: { ...sponsor },
    });

    return { logoPath: sponsor.logoPath };
  });

  if (!deleted) return { status: "notFound" };

  await removeUnreferencedLogos([deleted.logoPath]);

  return { status: "saved" };
}

type Written = { status: "saved"; previousPath: string } | { status: "notFound" };

async function writeIn(
  transaction: Prisma.TransactionClient,
  request: { actorId: string; id: string; sponsor: SponsorInput; hasUpload: boolean },
): Promise<Written> {
  const { actorId, id, sponsor, hasUpload } = request;
  const previous = id ? await transaction.sponsor.findUnique({ where: { id }, select: { logoPath: true } }) : null;
  const entityId = id ? await updateIn(transaction, id, sponsor) : await createIn(transaction, sponsor);

  if (!entityId) return { status: "notFound" };

  const audit = { actorId, entityType: ENTITY_TYPE, entityId };

  await recordAudit(transaction, {
    ...audit,
    action: id ? "sponsor.update" : "sponsor.create",
    detail: { ...sponsor },
  });

  if (hasUpload) {
    await recordAudit(transaction, { ...audit, action: "sponsor.logo.save", detail: { file: sponsor.logoPath } });
  }

  return { status: "saved", previousPath: previous?.logoPath ?? "" };
}

async function createIn(transaction: Prisma.TransactionClient, sponsor: SponsorInput): Promise<string> {
  const created = await transaction.sponsor.create({ data: sponsor, select: { id: true } });

  return created.id;
}

async function updateIn(
  transaction: Prisma.TransactionClient,
  id: string,
  sponsor: SponsorInput,
): Promise<string | null> {
  const { count } = await transaction.sponsor.updateMany({ where: { id }, data: sponsor });

  return count === 0 ? null : id;
}

// parseSponsorInput already refused `..` and anything that is not an image path, so the file stays inside public/ or
// inside the logos folder of the volume.
function logoFileExists(logoPath: string): boolean {
  const fileName = readSponsorLogoFileName(logoPath);

  return fileName ? sponsorLogoExists(fileName) : existsSync(path.join(process.cwd(), "public", logoPath));
}

function uploadedPaths(sponsor: SponsorInput, logo: SponsorLogoFile | null): string[] {
  return logo ? [sponsor.logoPath] : [];
}

/** Deletes the files of logos that no row shows any more. Paths of public/ and paths that are not ours stay. */
async function removeUnreferencedLogos(logoPaths: readonly string[]): Promise<void> {
  for (const logoPath of logoPaths) {
    const fileName = readSponsorLogoFileName(logoPath);

    if (fileName && (await getPrisma().sponsor.count({ where: { logoPath } })) === 0) {
      await removeSponsorLogo(fileName);
    }
  }
}
