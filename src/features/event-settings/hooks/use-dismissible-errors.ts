import { useEffect, useState, type RefObject } from "react";
import type { EventSettingsFormState } from "@features/event-settings/lib/event-settings-actions";
import { getRelatedFields, type EventSettingsErrors } from "@features/event-settings/lib/event-settings-input";

interface Dismissal {
  /** The answer of the server that the edits belong to: a new answer starts without dismissals. */
  state: EventSettingsFormState | null;
  fields: readonly string[];
}

interface DismissibleErrors {
  /** What to show under the form: the answer of the server until the visitor edits the field it is about. */
  visibleState: EventSettingsFormState | null;
  validationErrors: EventSettingsErrors | undefined;
}

/**
 * The errors of a refused save disappear as soon as the field they are about is edited (or the other hour of its pair),
 * instead of staying until the next press of "Guardar". A new answer of the server brings its errors back. The form
 * component of HeroUI has no onChange, so the edits are heard from the element itself.
 */
export function useDismissibleErrors(
  state: EventSettingsFormState | null,
  formRef: RefObject<HTMLFormElement | null>,
): DismissibleErrors {
  const [dismissal, setDismissal] = useState<Dismissal>({ state: null, fields: [] });

  useEffect(() => {
    const form = formRef.current;

    if (!form || !state) return;

    const dismissEdited = (event: Event) => {
      if (!(event.target instanceof HTMLInputElement)) return;

      const related = getRelatedFields(event.target.name);

      setDismissal((current) => ({
        state,
        fields: [...(current.state === state ? current.fields : []), ...related],
      }));
    };

    form.addEventListener("input", dismissEdited);

    return () => form.removeEventListener("input", dismissEdited);
  }, [state, formRef]);

  const dismissed = dismissal.state === state ? dismissal.fields : [];
  const errors = state?.status === "error" ? state.errors : undefined;
  const remaining = Object.fromEntries(Object.entries(errors ?? {}).filter(([field]) => !dismissed.includes(field)));
  const isAnswered = dismissed.length > 0 && Object.keys(remaining).length === 0;

  return { visibleState: isAnswered ? null : state, validationErrors: errors ? remaining : undefined };
}
