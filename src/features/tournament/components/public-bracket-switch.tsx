"use client";

import { Button } from "@heroui/react";
import type { PublicBracketActionState } from "@features/tournament/lib/public-bracket-actions";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { PUBLIC_BRACKET_PATH } from "@features/tournament/lib/tournament-links";
import { FormFeedback } from "@shared/components/form-feedback";
import { useActionForm } from "@shared/hooks/use-action-form";

export type PublicBracketSwitchAction = (
  previous: PublicBracketActionState | null,
  form: FormData,
) => Promise<PublicBracketActionState>;

interface PublicBracketSwitchProps {
  isEnabled: boolean;
  action: PublicBracketSwitchAction;
}

const COPY = TOURNAMENT_COPY.ui.publicBracket.admin;

/** Closes or reopens the public bracket (RF-74); the form sends the opposite of the value it shows. */
export function PublicBracketSwitch({ isEnabled, action }: Readonly<PublicBracketSwitchProps>) {
  const { state, formAction, isPending, formRef, handleSubmit } = useActionForm(action);

  return (
    <section aria-labelledby="public-bracket-switch-heading" className="grid gap-4">
      <h2 id="public-bracket-switch-heading" className="type-section">
        {COPY.heading}
      </h2>
      <p className="text-sm text-muted">{isEnabled ? COPY.isOpen : COPY.isClosed}</p>
      <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="grid justify-items-start gap-3">
        <input type="hidden" name="enabled" value={String(!isEnabled)} />
        <FormFeedback state={state} />
        <Button type="submit" variant={isEnabled ? "outline" : "primary"} className="min-h-11" isPending={isPending}>
          {getLabel(isPending, isEnabled)}
        </Button>
      </form>
      <a href={PUBLIC_BRACKET_PATH} className="touch-target relative w-fit link-wipe no-underline">
        {COPY.viewLink}
      </a>
    </section>
  );
}

function getLabel(isPending: boolean, isEnabled: boolean): string {
  if (isPending) return COPY.sending;

  return isEnabled ? COPY.close : COPY.reopen;
}
