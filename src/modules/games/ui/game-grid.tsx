import { EmptyState } from "@/shared/ui";
import type { Game } from "../domain/game";
import { GameCard } from "./game-card";

export function GameGrid({ games }: { games: Game[] }) {
  if (games.length === 0) {
    return <EmptyState message="Todavía no hay videojuegos publicados. ¡Pronto!" />;
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {games.map((game) => (
        <li key={game.id} className="flex">
          <GameCard game={game} />
        </li>
      ))}
    </ul>
  );
}
