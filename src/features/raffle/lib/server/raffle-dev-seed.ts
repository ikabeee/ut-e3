import "server-only";
import { createMissingDevAccounts } from "@features/accounts/lib/server/dev-accounts";
import { encryptPin, hashPinForLookup } from "@shared/lib/server/pin-cipher";
import { getPrisma } from "@shared/lib/server/prisma";

export type RaffleDevEnv = Readonly<Record<string, string | undefined>>;

export interface RaffleDevSeedResult {
  createdAccounts: string[];
  createdVisitors: number;
  createdTickets: number;
}

export const RAFFLE_DEV_ACCOUNTS = [
  { email: "rifa-1@ejemplo.com", name: "Animador 1 (prueba)", role: "raffle_admin" },
  { email: "rifa-2@ejemplo.com", name: "Animador 2 (prueba)", role: "raffle_admin" },
] as const;

// An example value for local development only; RAFFLE_DEV_PASSWORD replaces it.
export const RAFFLE_DEV_DEFAULT_PASSWORD = "raffle-dev-password";

export const RAFFLE_DEV_VISITOR_COUNT = 30;

// The first visitors reach 18 visits and hold two tickets (RF-22); the rest hold the ticket of the 9th visit.
export const RAFFLE_DEV_TWO_TICKET_VISITORS = 10;

// PINs 20001 to 20030, apart from the 10001 to 10024 of the stands seed.
const FIRST_PIN = 20001;

// The CHECK of event_settings needs the cutoff of check-ins before the start of the raffle.
const CUTOFF_BEFORE_START_MS = 60 * 1000;

const PRODUCTION_REFUSED =
  "Seed de la rifa: se niega a correr en producción (NODE_ENV=production). Es solo para desarrollo: crea cuentas con una contraseña de ejemplo y boletos sin visitas.";

const MISSING_SETTINGS = "Seed de la rifa: faltan los horarios del evento. Corre npm run db:seed primero.";

/**
 * Prepares the raffle for a manual test (development only): two raffle administrators, fake passports with their
 * tickets, and the start of the raffle moved to `now` when it is still ahead (the cutoff of check-ins moves a minute
 * before it). The tickets are created without visits. Running it again only adds what is missing.
 */
export async function seedRaffleDev(env: RaffleDevEnv, now: Date): Promise<RaffleDevSeedResult> {
  if (env.NODE_ENV === "production") throw new Error(PRODUCTION_REFUSED);

  await openRaffle(now);

  const password = env.RAFFLE_DEV_PASSWORD?.trim() || RAFFLE_DEV_DEFAULT_PASSWORD;
  const createdAccounts = await createMissingDevAccounts(RAFFLE_DEV_ACCOUNTS, password);
  const visitorIds = await createMissingVisitors();

  return {
    createdAccounts,
    createdVisitors: visitorIds.created,
    createdTickets: await createMissingTickets(visitorIds.all),
  };
}

// The date of the event stays untouched when the raffle already started.
async function openRaffle(now: Date): Promise<void> {
  const settings = await getPrisma().eventSettings.findUnique({
    where: { id: 1 },
    select: { raffleStartsAt: true, checkInCutoffAt: true },
  });

  if (!settings) throw new Error(MISSING_SETTINGS);

  if (settings.raffleStartsAt <= now) return;

  const latestCutoff = new Date(now.getTime() - CUTOFF_BEFORE_START_MS);
  const checkInCutoffAt = settings.checkInCutoffAt < latestCutoff ? settings.checkInCutoffAt : latestCutoff;

  await getPrisma().eventSettings.update({ where: { id: 1 }, data: { raffleStartsAt: now, checkInCutoffAt } });
}

async function createMissingVisitors(): Promise<{ all: string[]; created: number }> {
  const all: string[] = [];
  let created = 0;

  for (let index = 0; index < RAFFLE_DEV_VISITOR_COUNT; index += 1) {
    const pin = String(FIRST_PIN + index);
    const existing = await getPrisma().visitor.findUnique({ where: { pinLookup: hashPinForLookup(pin) } });

    all.push(existing?.id ?? (await createVisitor(pin)));
    created += existing ? 0 : 1;
  }

  return { all, created };
}

async function createVisitor(pin: string): Promise<string> {
  const visitor = await getPrisma().visitor.create({
    data: {
      fullName: `Visitante de rifa ${pin}`,
      gamertag: `Rifa${pin}`,
      email: `rifa${pin}@ejemplo.com`,
      pin: encryptPin(pin),
      pinLookup: hashPinForLookup(pin),
    },
    select: { id: true },
  });

  return visitor.id;
}

async function createMissingTickets(visitorIds: readonly string[]): Promise<number> {
  const wanted = visitorIds.flatMap((visitorId, index) =>
    index < RAFFLE_DEV_TWO_TICKET_VISITORS
      ? [
          { visitorId, milestone: 9 },
          { visitorId, milestone: 18 },
        ]
      : [{ visitorId, milestone: 9 }],
  );

  const held = await getPrisma().raffleTicket.findMany({
    where: { visitorId: { in: [...visitorIds] } },
    select: { visitorId: true, milestone: true },
  });

  const heldKeys = new Set(held.map((ticket) => `${ticket.visitorId}:${ticket.milestone}`));
  const missing = wanted.filter((ticket) => !heldKeys.has(`${ticket.visitorId}:${ticket.milestone}`));

  await getPrisma().raffleTicket.createMany({ data: missing });

  return missing.length;
}
