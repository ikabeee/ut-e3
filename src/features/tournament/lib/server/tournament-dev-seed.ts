import "server-only";
import type { KofDesk } from "@features/accounts/lib/types";
import { generateTournament } from "@features/tournament/lib/server/tournament-mutations";
import type { Player } from "@features/tournament/lib/types";
import { hashPassword } from "@shared/lib/server/password";
import { getPrisma } from "@shared/lib/server/prisma";

export type KofDevEnv = Readonly<Record<string, string | undefined>>;

interface KofDevAccount {
  email: string;
  name: string;
  role: "kof_admin" | "kof_staff";
  kofDesk: KofDesk | null;
}

export interface KofDevSeedResult {
  createdAccounts: string[];
  bracket: "created" | "alreadyGenerated";
}

export const KOF_DEV_ACCOUNTS: readonly KofDevAccount[] = [
  { email: "kof-admin@ejemplo.com", name: "Administrador de KOF (prueba)", role: "kof_admin", kofDesk: null },
  { email: "kof-mesa1@ejemplo.com", name: "Staff de KOF mesa 1 (prueba)", role: "kof_staff", kofDesk: 1 },
  { email: "kof-mesa2@ejemplo.com", name: "Staff de KOF mesa 2 (prueba)", role: "kof_staff", kofDesk: 2 },
];

// An example value for local development only; KOF_DEV_PASSWORD replaces it.
export const KOF_DEV_DEFAULT_PASSWORD = "kof-dev-password";

// 40 players leave 24 byes, enough to see every kind of match without waiting for M4.
export const KOF_DEV_PLAYER_COUNT = 40;

const PRODUCTION_REFUSED =
  "Seed de KOF: se niega a correr en producción (NODE_ENV=production). Es solo para desarrollo: crea cuentas con una contraseña de ejemplo.";

const MISSING_SETTINGS = "Seed de KOF: faltan los horarios del evento. Corre npm run db:seed primero.";

/**
 * Prepares the tournament for a manual test (development only): the three KOF accounts, the bracket hour moved to
 * `now` when it is still ahead, and a bracket of fake players. Running it again only adds what is missing.
 */
export async function seedKofDev(env: KofDevEnv, now: Date): Promise<KofDevSeedResult> {
  if (env.NODE_ENV === "production") throw new Error(PRODUCTION_REFUSED);

  await requireEventSettings();

  const createdAccounts = await createMissingAccounts(env.KOF_DEV_PASSWORD?.trim() || KOF_DEV_DEFAULT_PASSWORD);

  await openBracketHour(now);

  return { createdAccounts, bracket: await generateDevBracket(now) };
}

async function requireEventSettings(): Promise<void> {
  if (!(await getPrisma().eventSettings.findUnique({ where: { id: 1 }, select: { id: true } }))) {
    throw new Error(MISSING_SETTINGS);
  }
}

async function createMissingAccounts(password: string): Promise<string[]> {
  const created: string[] = [];

  for (const account of KOF_DEV_ACCOUNTS) {
    if (await getPrisma().account.findUnique({ where: { email: account.email }, select: { id: true } })) continue;

    await getPrisma().account.create({
      data: { ...account, status: "active", password: await hashPassword(password) },
    });
    created.push(account.email);
  }

  return created;
}

// The bracket is only generated from this hour on (RF-59); the date of the event stays untouched when it already passed.
async function openBracketHour(now: Date): Promise<void> {
  await getPrisma().eventSettings.updateMany({
    where: { id: 1, kofBracketGeneratesAt: { gt: now } },
    data: { kofBracketGeneratesAt: now },
  });
}

async function generateDevBracket(now: Date): Promise<KofDevSeedResult["bracket"]> {
  const admin = await getPrisma().account.findUniqueOrThrow({ where: { email: KOF_DEV_ACCOUNTS[0].email } });
  const result = await generateTournament(admin.id, createDevPlayers(), now);

  if (result.status === "tooEarly") throw new Error(MISSING_SETTINGS);

  return result.status;
}

function createDevPlayers(): Player[] {
  return Array.from({ length: KOF_DEV_PLAYER_COUNT }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");

    return { id: `dev-player-${number}`, tag: `Jugador ${number}` };
  });
}
