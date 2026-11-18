"use client";

import { GAMES_COPY } from "@features/games/lib/games-copy";
import type { StandGameActionState } from "@features/games/lib/stand-game-actions";
import { ConfirmActionForm } from "@shared/components/confirm-action-form";

interface StandGameDeleteProps {
  gameName: string;
  action: (previous: StandGameActionState | null, form: FormData) => Promise<StandGameActionState>;
}

const COPY = GAMES_COPY.standGame.deleteGame;

/** Deleting the game asks first: the game and its images cannot be brought back (S27). */
export function StandGameDelete({ gameName, action }: Readonly<StandGameDeleteProps>) {
  return (
    <section aria-labelledby="stand-game-delete-heading" className="grid max-w-2xl gap-3 border border-danger p-4">
      <h2 id="stand-game-delete-heading" className="type-section">
        {COPY.heading}
      </h2>
      <p className="text-sm text-muted">{COPY.lead}</p>
      <ConfirmActionForm
        action={action}
        field={{ name: "intent", value: "delete" }}
        labels={{
          trigger: COPY.trigger,
          prompt: COPY.prompt(gameName),
          confirm: COPY.confirm,
          cancel: COPY.cancel,
        }}
      />
    </section>
  );
}
