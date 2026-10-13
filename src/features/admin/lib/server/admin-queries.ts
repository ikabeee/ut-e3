import "server-only";
import { notFound } from "next/navigation";
import { summarizeAdmin, toAdminOptions } from "@features/admin/lib/admin-records";
import { listGenres, listPlatforms } from "@features/games/lib/server/catalog-options-queries";
import { listGameRecords } from "@features/games/lib/server/games-admin-queries";
import { listTeams } from "@features/teams/lib/server/teams-queries";
import { listRaffleWinners } from "@features/visitors/lib/server/raffle-queries";
import { isAdminRequest } from "@shared/lib/server/admin-auth";

// Datos de las páginas del panel. `src/proxy.ts` ya pide usuario y contraseña; aquí se vuelve a
// comprobar por si una ruta queda fuera del `matcher`: sin credenciales, la página no existe.

async function requireAdmin() {
  if (!(await isAdminRequest())) notFound();
}

export async function getAdminSummary() {
  await requireAdmin();
  const [teams, games, winners] = await Promise.all([listTeams(), listGameRecords(), listRaffleWinners()]);

  return summarizeAdmin(teams, games, winners.length);
}

export async function getAdminTeams() {
  await requireAdmin();

  return listTeams();
}

export async function getAdminGames() {
  await requireAdmin();

  const [games, teams, genres, platforms] = await Promise.all([
    listGameRecords(),
    listTeams(),
    listGenres(),
    listPlatforms(),
  ]);

  return {
    games,
    options: { teams: toAdminOptions(teams), genres: toAdminOptions(genres), platforms: toAdminOptions(platforms) },
  };
}

export async function getAdminCatalog() {
  await requireAdmin();
  const [genres, platforms] = await Promise.all([listGenres(), listPlatforms()]);

  return { genres, platforms };
}

export async function getAdminRaffleWinners() {
  await requireAdmin();

  return listRaffleWinners();
}
