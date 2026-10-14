import "server-only";
import { notFound } from "next/navigation";
import { summarizeAdmin, toAdminOptions } from "@features/admin/lib/admin-records";
import type { listGenres, listPlatforms } from "@features/games/lib/server/catalog-options-queries";
import type { listGameRecords } from "@features/games/lib/server/games-admin-queries";
import type { listTeams } from "@features/teams/lib/server/teams-queries";
import type { listRaffleWinners } from "@features/visitors/lib/server/raffle-queries";
import { isAdminRequest } from "@shared/lib/server/admin-auth";

export interface AdminQueriesDependencies {
  checkAdmin?: () => Promise<boolean>;
  onNotFound?: () => never;
  listTeams?: typeof listTeams;
  listGameRecords?: typeof listGameRecords;
  listRaffleWinners?: typeof listRaffleWinners;
  listGenres?: typeof listGenres;
  listPlatforms?: typeof listPlatforms;
}

const defaultListTeams = async () => (await import("@features/teams/lib/server/teams-queries")).listTeams();

const defaultListGameRecords = async () =>
  (await import("@features/games/lib/server/games-admin-queries")).listGameRecords();

const defaultListRaffleWinners = async () =>
  (await import("@features/visitors/lib/server/raffle-queries")).listRaffleWinners();

const defaultListGenres = async () => (await import("@features/games/lib/server/catalog-options-queries")).listGenres();

const defaultListPlatforms = async () =>
  (await import("@features/games/lib/server/catalog-options-queries")).listPlatforms();

// Datos de las páginas del panel. `src/proxy.ts` ya pide usuario y contraseña; aquí se vuelve a
// comprobar por si una ruta queda fuera del `matcher`: sin credenciales, la página no existe.

async function requireAdmin(deps?: AdminQueriesDependencies) {
  const checkAdmin = deps?.checkAdmin ?? isAdminRequest;
  const onNotFound = deps?.onNotFound ?? notFound;

  if (!(await checkAdmin())) onNotFound();
}

export async function getAdminSummary(deps?: AdminQueriesDependencies) {
  await requireAdmin(deps);
  const fetchTeams = deps?.listTeams ?? defaultListTeams;
  const fetchGames = deps?.listGameRecords ?? defaultListGameRecords;
  const fetchWinners = deps?.listRaffleWinners ?? defaultListRaffleWinners;
  const [teams, games, winners] = await Promise.all([fetchTeams(), fetchGames(), fetchWinners()]);

  return summarizeAdmin(teams, games, winners.length);
}

export async function getAdminTeams(deps?: AdminQueriesDependencies) {
  await requireAdmin(deps);
  const fetchTeams = deps?.listTeams ?? defaultListTeams;

  return fetchTeams();
}

export async function getAdminGames(deps?: AdminQueriesDependencies) {
  await requireAdmin(deps);

  const fetchGames = deps?.listGameRecords ?? defaultListGameRecords;
  const fetchTeams = deps?.listTeams ?? defaultListTeams;
  const fetchGenres = deps?.listGenres ?? defaultListGenres;
  const fetchPlatforms = deps?.listPlatforms ?? defaultListPlatforms;

  const [games, teams, genres, platforms] = await Promise.all([
    fetchGames(),
    fetchTeams(),
    fetchGenres(),
    fetchPlatforms(),
  ]);

  return {
    games,
    options: { teams: toAdminOptions(teams), genres: toAdminOptions(genres), platforms: toAdminOptions(platforms) },
  };
}

export async function getAdminCatalog(deps?: AdminQueriesDependencies) {
  await requireAdmin(deps);
  const fetchGenres = deps?.listGenres ?? defaultListGenres;
  const fetchPlatforms = deps?.listPlatforms ?? defaultListPlatforms;
  const [genres, platforms] = await Promise.all([fetchGenres(), fetchPlatforms()]);

  return { genres, platforms };
}

export async function getAdminRaffleWinners(deps?: AdminQueriesDependencies) {
  await requireAdmin(deps);
  const fetchWinners = deps?.listRaffleWinners ?? defaultListRaffleWinners;

  return fetchWinners();
}
