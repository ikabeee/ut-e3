import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";
import type { SponsorInput } from "@features/sponsors/lib/sponsor-input";
import type { Prisma } from "@generated/prisma/client";
import { recordAudit } from "@shared/lib/server/audit-log";
import { isCheckViolation } from "@shared/lib/server/database-errors";
import { getPrisma } from "@shared/lib/server/prisma";

export type SponsorWriteResult = { status: "saved" | "notFound" | "rejected" | "missingLogo" };

const ENTITY_TYPE = "sponsor";

/** Creates a sponsor, or changes it when `id` names one (RF-41). Each write leaves its entry in the audit log. */
export async function saveSponsor(actorId: string, id: string, sponsor: SponsorInput): Promise<SponsorWriteResult> {
  // The logos ship inside public/ with the build: a path that is not there would show a broken image on the landing.
  if (!isPublicFile(sponsor.logoPath)) return { status: "missingLogo" };

  try {
    return await getPrisma().$transaction(async (transaction): Promise<SponsorWriteResult> => {
      const entityId = id ? await updateIn(transaction, id, sponsor) : await createIn(transaction, sponsor);

      if (!entityId) return { status: "notFound" };

      await recordAudit(transaction, {
        actorId,
        action: id ? "sponsor.update" : "sponsor.create",
        entityType: ENTITY_TYPE,
        entityId,
        detail: { ...sponsor },
      });

      return { status: "saved" };
    });
  } catch (cause) {
    if (isCheckViolation(cause)) return { status: "rejected" };

    throw cause;
  }
}

export async function deleteSponsor(actorId: string, id: string): Promise<SponsorWriteResult> {
  return getPrisma().$transaction(async (transaction): Promise<SponsorWriteResult> => {
    const sponsor = await transaction.sponsor.findUnique({ where: { id } });

    if (!sponsor) return { status: "notFound" };

    await transaction.sponsor.delete({ where: { id } });
    await recordAudit(transaction, {
      actorId,
      action: "sponsor.delete",
      entityType: ENTITY_TYPE,
      entityId: id,
      detail: { ...sponsor },
    });

    return { status: "saved" };
  });
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

// parseSponsorInput already refused `..` and anything that is not an image path, so the file stays inside public/.
function isPublicFile(publicPath: string): boolean {
  return existsSync(path.join(process.cwd(), "public", publicPath));
}
