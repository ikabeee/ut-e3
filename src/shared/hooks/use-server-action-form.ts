import { useState, useTransition, type FormEvent } from "react";
import type { ActionResult, FieldErrors, FormAction } from "@shared/lib/action-result";
import { formDataToInput } from "@shared/lib/form-input";

const NO_FIELD_ERRORS: FieldErrors = {};

/**
 * Envía un formulario a una Server Action que devuelve `ActionResult` y expone su estado:
 * `isPending` mientras corre, el `error` general y los `fieldErrors` para el `Form` de
 * HeroUI (`validationErrors`).
 *
 * ```tsx
 * const form = useServerActionForm(action); // `action` llega como prop desde la page
 * <Form onSubmit={form.submit} validationErrors={form.fieldErrors}>...</Form>
 * ```
 */
export function useServerActionForm<T>(action: FormAction<T>, onSuccess?: (data: T) => void) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<T> | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = formDataToInput(new FormData(event.currentTarget));
    startTransition(async () => {
      const next = await action(input);
      setResult(next);
      if (next.ok) onSuccess?.(next.data);
    });
  };

  const failure = result && !result.ok ? result : null;
  return {
    submit,
    isPending,
    error: failure?.error ?? null,
    fieldErrors: failure?.fieldErrors ?? NO_FIELD_ERRORS,
  };
}
