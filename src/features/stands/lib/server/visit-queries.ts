import "server-only";
import { formatStandCode } from "@features/games/lib/stand-code";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";
import { hashPinForLookup } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";

export interface KioskStand {
  code: string;
  /** Null until the stand registers its game: without it the kiosk records no visits (RF-34). */
  gameName: string | null;
}

export type VisitRefusal = { status: "closed" | "standWithoutGame" | "unknownPin" | "alreadyVisited" };

export type VisitCheck = { status: "ready"; visitorId: string } | VisitRefusal;

export async function getKioskStand(standId: string): Promise<KioskStand> {
  const stand = await getPrisma().stand.findUniqueOrThrow({
    where: { id: standId },
    select: { zone: true, number: true, game: { select: { name: true } } },
  });

  return { code: formatStandCode(stand), gameName: stand.game?.name ?? null };
}

/**
 * Whether a PIN may record a visit at the stand right now. The kiosk asks before showing the survey and the server asks
 * again when the survey arrives, because the Server Action is a public endpoint.
 */
export async function checkVisit(standId: string, pin: string, now: Date): Promise<VisitCheck> {
  const refusal = await findStandRefusal(standId, now);

  if (refusal) return refusal;

  const visitor = await getPrisma().visitor.findUnique({
    where: { pinLookup: hashPinForLookup(pin) },
    select: { id: true, checkIns: { where: { standId }, select: { id: true } } },
  });

  if (!visitor) return { status: "unknownPin" };

  return visitor.checkIns.length > 0 ? { status: "alreadyVisited" } : { status: "ready", visitorId: visitor.id };
}

/** The same check for a visitor that is already known, such as the one answering a pending visit from the passport. */
export async function checkVisitor(standId: string, visitorId: string, now: Date): Promise<VisitCheck> {
  const refusal = await findStandRefusal(standId, now);

  if (refusal) return refusal;

  const visits = await getPrisma().checkIn.count({ where: { standId, visitorId } });

  return visits > 0 ? { status: "alreadyVisited" } : { status: "ready", visitorId };
}

async function findStandRefusal(standId: string, now: Date): Promise<VisitRefusal | null> {
  if (await isPastCutoff(now)) return { status: "closed" };

  return (await standHasGame(standId)) ? null : { status: "standWithoutGame" };
}

// Visits count until the cutoff (RN-04). Read from the table, not from the cache: the sysadmin can move the hour.
async function isPastCutoff(now: Date): Promise<boolean> {
  const settings = await getPrisma().eventSettings.findUnique({
    where: { id: 1 },
    select: { checkInCutoffAt: true },
  });

  if (!settings) throw new Error(STANDS_COPY.kiosk.errors.missingSettings);

  return now >= settings.checkInCutoffAt;
}

async function standHasGame(standId: string): Promise<boolean> {
  return (await getPrisma().game.count({ where: { standId } })) > 0;
}
