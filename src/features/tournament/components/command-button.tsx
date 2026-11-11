"use client";

import { Button } from "@heroui/react";
import { useActionState, useEffect, useState } from "react";
import type { TournamentActionState } from "@features/tournament/lib/tournament-actions";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import type { SlotIndex, TournamentCommandType } from "@features/tournament/lib/types";

export type TournamentAction = (
  previous: TournamentActionState | null,
  form: FormData,
) => Promise<TournamentActionState>;

/** The fields the Server Action reads: the command, the match and, when it names players, their slots. */
export interface CommandFields {
  type: TournamentCommandType;
  matchId: string;
  slots?: readonly SlotIndex[];
}

type CommandVariant = "primary" | "outline" | "danger" | "tertiary";

interface CommandButtonProps {
  action: TournamentAction;
  /** Called after the server applied the command, so the screen does not wait for the next poll. */
  onApplied: () => void;
  label: string;
  command: CommandFields;
  /** The first press only asks; the command is sent on the second. */
  needsConfirmation?: boolean;
  variant?: CommandVariant;
}

interface SubmitRowProps {
  label: string;
  variant: CommandVariant;
  needsConfirmation: boolean;
  isPending: boolean;
  onCancel: () => void;
}

const COPY = TOURNAMENT_COPY.ui.actions;

export function CommandButton({
  action,
  onApplied,
  label,
  command,
  needsConfirmation = false,
  variant = "outline",
}: Readonly<CommandButtonProps>) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [state, formAction, isPending] = useActionState(action, null);

  useEffect(() => {
    if (state?.status === "applied") onApplied();
  }, [state, onApplied]);

  if (needsConfirmation && !isConfirming) {
    return (
      <Button variant={variant} className="min-h-11" onPress={() => setIsConfirming(true)}>
        {label}
      </Button>
    );
  }

  return (
    <form action={formAction} className="grid gap-2">
      <CommandInputs command={command} />
      <FormFeedback needsConfirmation={needsConfirmation} state={state} />
      <SubmitRow
        label={label}
        variant={variant}
        needsConfirmation={needsConfirmation}
        isPending={isPending}
        onCancel={() => setIsConfirming(false)}
      />
    </form>
  );
}

function CommandInputs({ command }: Readonly<{ command: CommandFields }>) {
  return (
    <>
      <input type="hidden" name="type" value={command.type} />
      <input type="hidden" name="matchId" value={command.matchId} />
      {command.slots?.map((slot) => (
        <input key={slot} type="hidden" name="slot" value={slot} />
      ))}
    </>
  );
}

function FormFeedback({
  needsConfirmation,
  state,
}: Readonly<{ needsConfirmation: boolean; state: TournamentActionState | null }>) {
  return (
    <>
      {needsConfirmation && <p className="text-sm">{COPY.confirmQuestion}</p>}
      {state?.status === "error" && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}
    </>
  );
}

function SubmitRow({ label, variant, needsConfirmation, isPending, onCancel }: Readonly<SubmitRowProps>) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="submit" variant={variant} className="min-h-11" isPending={isPending}>
        {needsConfirmation ? `${COPY.confirm}: ${label}` : label}
      </Button>
      {needsConfirmation && (
        <Button variant="tertiary" className="min-h-11" onPress={onCancel}>
          {COPY.cancel}
        </Button>
      )}
    </div>
  );
}
