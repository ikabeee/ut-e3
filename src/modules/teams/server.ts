// Casos de uso del módulo `teams` conectados a su infraestructura.
// Sólo se puede importar desde código de servidor.
import "server-only";
import { makeListTeams } from "./application/list-teams";
import { prismaTeamRepository } from "./infrastructure/prisma-team-repository";

export const listTeams = makeListTeams(prismaTeamRepository);
