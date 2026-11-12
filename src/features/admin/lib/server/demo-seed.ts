import "server-only";
import {
  seedRaffleDev,
  RAFFLE_DEV_ACCOUNTS,
  type RaffleDevSeedResult,
} from "@features/raffle/lib/server/raffle-dev-seed";
import {
  seedStandsDev,
  STAND_DEV_ADMIN_EMAIL,
  getStandDevStaffEmail,
} from "@features/stands/lib/server/stands-dev-seed";
import { SUPPORT_DEV_HELP_DESK_EMAIL, seedSupportDev } from "@features/support/lib/server/support-dev-seed";
import {
  KOF_DEV_ACCOUNTS,
  seedKofDev,
  type KofDevSeedResult,
} from "@features/tournament/lib/server/tournament-dev-seed";
import type { DevSeedOptions } from "@shared/lib/server/dev-seed-options";
import { hashPassword, verifyPassword } from "@shared/lib/server/password";
import { getPrisma } from "@shared/lib/server/prisma";

export type DemoSeedEnv = Readonly<Record<string, string | undefined>>;

export interface DemoSeedOptions {
  /** Moves the start of the raffle to now (and the cutoff of check-ins before it): the only hour the demo may move. */
  openRaffle: boolean;
}

export interface DemoAccountRow {
  email: string;
  role: string;
  status: string;
}

export interface DemoSeedResult {
  password: string;
  accounts: DemoAccountRow[];
  bracket: KofDevSeedResult["bracket"];
  raffle: RaffleDevSeedResult;
  raffleOpened: boolean;
}

// An example value for the demo only; DEMO_PASSWORD replaces it. It passes the 12 characters of a real password.
export const DEMO_DEFAULT_PASSWORD = "demo-password-ute3";

const HOURS_UNTOUCHED = { moveHours: false } satisfies DevSeedOptions;

/**
 * Prepares a demo with every account in one go: the staff of the stands, the KOF desks, the help desk and the raffle
 * hosts, all with the same password. It runs the single dev seeds without moving the hours of the event, except the raffle
 * when `openRaffle` asks for it. Accounts that already existed get the demo password too, so the table that the script
 * prints is true. Running it again only adds what is missing.
 */
export async function seedDemo(env: DemoSeedEnv, now: Date, options: DemoSeedOptions): Promise<DemoSeedResult> {
  refuseProduction(env);

  const password = env.DEMO_PASSWORD?.trim() || DEMO_DEFAULT_PASSWORD;
  const demoEnv = pickOneSharedPassword(env, password);

  await seedStandsDev(demoEnv, now, HOURS_UNTOUCHED);

  const kof = await seedKofDev(demoEnv, now, HOURS_UNTOUCHED);

  await seedSupportDev(demoEnv);

  const raffle = await seedRaffleDev(demoEnv, now, { moveHours: options.openRaffle });
  const emails = await listDemoEmails();

  await setDemoPassword(emails, password);

  return {
    password,
    accounts: await listDemoAccounts(emails),
    bracket: kof.bracket,
    raffle,
    raffleOpened: options.openRaffle,
  };
}

/** The table that the script prints at the end: who, with which role, and the one password. */
export function formatDemoTable(result: DemoSeedResult): string {
  const rows = result.accounts.map((account) => [account.email, account.role, result.password, account.status]);
  const table = [["Correo", "Rol", "Contraseña", "Estado"], ...rows];
  const widths = table[0].map((_, column) => Math.max(...table.map((row) => row[column].length)));

  return table
    .map((row) =>
      row
        .map((cell, column) => cell.padEnd(widths[column]))
        .join("  ")
        .trimEnd(),
    )
    .join("\n");
}

function refuseProduction(env: DemoSeedEnv): void {
  const signs = findProductionSigns(env);

  if (signs.length > 0) {
    throw new Error(
      `Seed de demo: se niega a correr porque el entorno parece de producción (${signs.join("; ")}). Es solo para desarrollo y demos: crea cuentas con una contraseña compartida.`,
    );
  }
}

/** The signs that this is not a machine for a demo; empty when it is safe to seed. */
export function findProductionSigns(env: DemoSeedEnv): string[] {
  const signs: string[] = [];

  if (env.NODE_ENV === "production") signs.push("NODE_ENV=production");

  if (env.SITE_MODE?.trim() === "landing") signs.push("SITE_MODE=landing (el modo de producción)");

  if (env.VERCEL_ENV === "production" || env.APP_ENV === "production") signs.push("VERCEL_ENV o APP_ENV de producción");

  // The Docker image keeps its database in the volume /data.
  if (/(^|[:/])data\/app\.db$/.test(env.DATABASE_URL?.trim() ?? "")) signs.push("DATABASE_URL apunta a /data/app.db");

  return signs;
}

function pickOneSharedPassword(env: DemoSeedEnv, password: string) {
  return {
    ...env,
    STAND_DEV_PASSWORD: password,
    KOF_DEV_PASSWORD: password,
    SUPPORT_DEV_PASSWORD: password,
    RAFFLE_DEV_PASSWORD: password,
  };
}

async function listDemoEmails(): Promise<string[]> {
  const stands = await getPrisma().stand.findMany({
    where: { game: { isNot: null } },
    orderBy: [{ zone: "asc" }, { number: "asc" }],
    select: { zone: true, number: true },
  });

  return [
    ...stands.map((stand) => getStandDevStaffEmail(stand.zone, stand.number)),
    STAND_DEV_ADMIN_EMAIL,
    ...KOF_DEV_ACCOUNTS.map((account) => account.email),
    SUPPORT_DEV_HELP_DESK_EMAIL,
    ...RAFFLE_DEV_ACCOUNTS.map((account) => account.email),
  ];
}

// Accounts that were created by an older seed keep the password they had: the demo gives them the shared one.
async function setDemoPassword(emails: readonly string[], password: string): Promise<void> {
  const accounts = await getPrisma().account.findMany({
    where: { email: { in: [...emails] }, status: "active" },
    select: { id: true, password: true },
  });

  for (const account of accounts) {
    if (account.password && (await verifyPassword(password, account.password))) continue;

    await getPrisma().account.update({ where: { id: account.id }, data: { password: await hashPassword(password) } });
  }
}

async function listDemoAccounts(emails: readonly string[]): Promise<DemoAccountRow[]> {
  const accounts = await getPrisma().account.findMany({
    where: { email: { in: [...emails] } },
    select: { email: true, role: true, status: true },
  });

  const order = new Map(emails.map((email, index) => [email, index]));

  return accounts.toSorted((first, second) => (order.get(first.email) ?? 0) - (order.get(second.email) ?? 0));
}
