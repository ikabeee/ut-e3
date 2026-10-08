import type { Game } from "../domain/game";
import type { GameRepository } from "../domain/game-repository";

export function makeGetGameBySlug(repository: GameRepository) {
  return async function getGameBySlug(slug: string): Promise<Game | null> {
    return repository.findPublishedBySlug(slug);
  };
}
