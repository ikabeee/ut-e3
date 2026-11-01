import "server-only";
import { createMissingDevAccounts } from "@features/accounts/lib/server/dev-accounts";
import { formatStandCode } from "@features/games/lib/stand-code";
import { encryptPin, hashPinForLookup } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";

export type StandsDevEnv = Readonly<Record<string, string | undefined>>;

export interface StandsDevSeedResult {
  createdAccounts: string[];
  createdVisitors: number;
}

// An example value for local development only; STAND_DEV_PASSWORD replaces it.
export const STAND_DEV_DEFAULT_PASSWORD = "stand-dev-password";

export const STAND_DEV_ADMIN_EMAIL = "stand-admin@ejemplo.com";

export const STAND_DEV_VISITOR_COUNT = 24;

// The passport that arrives at its 9th visit with the next stand (RF-22), to see a ticket granted in the demo.
export const STAND_DEV_NEARLY_THERE_PIN = "10001";

const PREVIOUS_VISITS = 8;

const PRODUCTION_REFUSED =
  "Seed de stands: se niega a correr en producción (NODE_ENV=production). Es solo para desarrollo: crea cuentas con una contraseña de ejemplo.";

const MISSING_STANDS = "Seed de stands: faltan los stands de muestra. Corre npm run db:seed primero.";

/**
 * Prepares the kiosk for a manual test (development only): one staff account per sample stand, an administrator for
 * the first one and fake passports with fixed PINs, and the registration hour moved to `now` when it is still ahead so
 * a real passport can be created. Running it again only adds what is missing.
 */
export async function seedStandsDev(env: StandsDevEnv, now: Date): Promise<StandsDevSeedResult> {
  if (env.NODE_ENV === "production") throw new Error(PRODUCTION_REFUSED);

  const stands = await getPrisma().stand.findMany({
    where: { game: { isNot: null } },
    orderBy: [{ zone: "asc" }, { number: "asc" }],
    include: { game: { select: { id: true } } },
  });

  if (stands.length === 0) throw new Error(MISSING_STANDS);

  const password = env.STAND_DEV_PASSWORD?.trim() || STAND_DEV_DEFAULT_PASSWORD;
  const createdAccounts = await createMissingAccounts(stands, password);
  const createdVisitors = await createMissingVisitors();

  await openRegistration(now);
  await createPreviousVisits(stands.map((stand) => stand.id).slice(1, 1 + PREVIOUS_VISITS));

  return { createdAccounts, createdVisitors };
}

export function getStandDevStaffEmail(zone: string, number: number): string {
  return `staff-${formatStandCode({ zone, number }).toLowerCase()}@ejemplo.com`;
}

interface DevStand {
  id: string;
  zone: string;
  number: number;
}

// Visitors register from this hour on (RF-02); the date of the event stays untouched when it already passed.
async function openRegistration(now: Date): Promise<void> {
  await getPrisma().eventSettings.updateMany({
    where: { id: 1, registrationOpensAt: { gt: now } },
    data: { registrationOpensAt: now },
  });
}

async function createMissingAccounts(stands: readonly DevStand[], password: string): Promise<string[]> {
  const accounts = stands.map((stand) => ({
    email: getStandDevStaffEmail(stand.zone, stand.number),
    name: `Staff del stand ${formatStandCode(stand)} (prueba)`,
    role: "stand_staff",
    standId: stand.id,
  }));

  accounts.push({
    email: STAND_DEV_ADMIN_EMAIL,
    name: "Administrador de stand (prueba)",
    role: "stand_admin",
    standId: stands[0].id,
  });

  return createMissingDevAccounts(accounts, password);
}

async function createMissingVisitors(): Promise<number> {
  let created = 0;

  for (let index = 0; index < STAND_DEV_VISITOR_COUNT; index += 1) {
    const pin = String(10001 + index);

    if (await getPrisma().visitor.findUnique({ where: { pinLookup: hashPinForLookup(pin) }, select: { id: true } })) {
      continue;
    }

    await getPrisma().visitor.create({
      data: {
        fullName: `Visitante de prueba ${pin}`,
        gamertag: `Visitante${pin}`,
        email: `visitante${pin}@ejemplo.com`,
        pin: encryptPin(pin),
        pinLookup: hashPinForLookup(pin),
      },
    });
    created += 1;
  }

  return created;
}

async function createPreviousVisits(standIds: readonly string[]): Promise<void> {
  const visitor = await getPrisma().visitor.findUniqueOrThrow({
    where: { pinLookup: hashPinForLookup(STAND_DEV_NEARLY_THERE_PIN) },
    select: { id: true },
  });

  for (const standId of standIds) {
    if (await getPrisma().checkIn.findUnique({ where: { visitorId_standId: { visitorId: visitor.id, standId } } })) {
      continue;
    }

    await getPrisma().checkIn.create({
      data: {
        visitorId: visitor.id,
        standId,
        vote: { create: { visitorId: visitor.id, standId, gameRating: 4, standRating: 4, artRating: 4 } },
      },
    });
  }
}
