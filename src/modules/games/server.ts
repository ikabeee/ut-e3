// Casos de uso del módulo `games` conectados a su infraestructura.
// Sólo se puede importar desde código de servidor.
import "server-only";
import { makeGetGameBySlug } from "./application/get-game-by-slug";
import { makeListPublishedGames } from "./application/list-published-games";
import { prismaGameRepository } from "./infrastructure/prisma-game-repository";

export const listPublishedGames = makeListPublishedGames(prismaGameRepository);
export const getGameBySlug = makeGetGameBySlug(prismaGameRepository);
