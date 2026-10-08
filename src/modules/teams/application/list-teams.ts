import type { Team } from "../domain/team";
import type { TeamRepository } from "../domain/team-repository";

export function makeListTeams(repository: TeamRepository) {
  return async function listTeams(): Promise<Team[]> {
    return repository.listAll();
  };
}
