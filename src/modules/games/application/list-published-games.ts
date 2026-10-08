import type { Game } from "../domain/game";
import type { GameRepository } from "../domain/game-repository";

export function makeListPublishedGames(repository: GameRepository) {
  return async function listPublishedGames(): Promise<Game[]> {
    return repository.listPublished();
  };
}
