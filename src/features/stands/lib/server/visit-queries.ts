import "server-only";
import { formatStandCode } from "@features/games/lib/stand-code";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";
import { isLateVisit } from "@features/stands/lib/visit-timing";
import { hashPinForLookup } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";

export interface KioskStand {
  code: string;
  /** Null until the stand registers its game: without it the kiosk records no visits (RF-34). */
  gameName: string | null;
}

export type VisitRefusal = {
  status: "closed" | "standWithoutGame" | "unknownPin" | "alreadyVisited" | "excluded" | "ownStand";
};

export type VisitCheck = { status: "ready"; visitorId: string } | VisitRefusal;

export async function getKioskStand(standId: string): Promise<KioskStand> {
  const stand = await getPrisma().stand.findUniqueOrThrow({
    where: { id: standId },
    select: { zone: true, number: true, game: { select: { name: true } } },
  });

  return { code: formatStandCode(stand), gameName: stand.game?.name ?? null };
}

/**
 * The hour from which the kiosk records no visits: the cutoff of the check-ins (RN-04; the table does not allow the
 * raffle to start before it). Read from the table because the sysadmin can move it.
 */
export async function getVisitClosingTime(): Promise<Date> {
  const settings = await getPrisma().eventSettings.findUnique({ where: { id: 1 }, select: { checkInCutoffAt: true } });

  if (!settings) throw new Error(STANDS_COPY.kiosk.errors.missingSettings);

  return settings.checkInCutoffAt;
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
    select: { id: true, email: true, excludedAt: true, _count: { select: { checkIns: { where: { standId } } } } },
  });

  return judgeVisitor(standId, visitor);
}

/**
 * The same check for a visitor that is already known, such as the one answering a pending visit from the passport.
 * `scannedAt` is when the staff typed the PIN: as in the offline queue, the visit counts if that was before the cutoff
 * and the answer arrives before the raffle (RN-04).
 */
export async function checkVisitor(
  standId: string,
  visitorId: string,
  { scannedAt, now }: { scannedAt: Date; now: Date },
): Promise<VisitCheck> {
  const refusal = await findStandRefusal(standId, now, scannedAt);

  if (refusal) return refusal;

  const visitor = await getPrisma().visitor.findUnique({
    where: { id: visitorId },
    select: { id: true, email: true, excludedAt: true, _count: { select: { checkIns: { where: { standId } } } } },
  });

  return judgeVisitor(standId, visitor);
}

interface CheckedVisitor {
  id: string;
  email: string;
  excludedAt: Date | null;
  /** The visits of the passport to the stand, annulled ones included. */
  _count: { checkIns: number };
}

async function judgeVisitor(standId: string, visitor: CheckedVisitor | null): Promise<VisitCheck> {
  if (!visitor) return { status: "unknownPin" };

  // An excluded passport records nothing (RF-46, UT-CI-19). An annulled visit still holds its stand (RF-23).
  if (visitor.excludedAt) return { status: "excluded" };

  if (await isStaffOfStand(standId, visitor.email)) return { status: "ownStand" };

  return visitor._count.checkIns > 0 ? { status: "alreadyVisited" } : { status: "ready", visitorId: visitor.id };
}

/**
 * Whether the email of a passport belongs to the administrator or staff of the stand, active or invited (RN-02): such a
 * passport takes part everywhere except in its own stand. Accounts store their email lowercased and visitors ignore the
 * case, so the comparison does too.
 */
export async function isStaffOfStand(standId: string, email: string): Promise<boolean> {
  const account = await getPrisma().account.findFirst({
    where: {
      standId,
      email: email.toLowerCase(),
      role: { in: ["stand_admin", "stand_staff"] },
      status: { in: ["active", "invited"] },
    },
    select: { id: true },
  });

  return account !== null;
}

async function findStandRefusal(standId: string, now: Date, scannedAt = now): Promise<VisitRefusal | null> {
  if (await isLate(scannedAt, now)) return { status: "closed" };

  return (await standHasGame(standId)) ? null : { status: "standWithoutGame" };
}

// Visits count until the cutoff (RN-04). Read from the table, not from the cache: the sysadmin can move the hour.
async function isLate(scannedAt: Date, now: Date): Promise<boolean> {
  const settings = await getPrisma().eventSettings.findUnique({
    where: { id: 1 },
    select: { checkInCutoffAt: true, raffleStartsAt: true },
  });

  if (!settings) throw new Error(STANDS_COPY.kiosk.errors.missingSettings);

  return isLateVisit(scannedAt, now, settings);
}

async function standHasGame(standId: string): Promise<boolean> {
  return (await getPrisma().game.count({ where: { standId } })) > 0;
}
