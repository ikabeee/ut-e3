import { useState, useTransition, type FormEvent } from "react";
import type { ActionResult, FieldErrors, FormAction } from "@shared/lib/action-result";
import { formDataToInput } from "@shared/lib/form-input";

const NO_FIELD_ERRORS: FieldErrors = {};

/** Quita el error de `name`; si era el último, quita también el fallo (era sólo de validación). */
function withoutFieldError<T>(result: ActionResult<T> | null, name: string): ActionResult<T> | null {
  if (!result || result.ok || !result.fieldErrors?.[name]) return result;
  const fieldErrors = Object.fromEntries(Object.entries(result.fieldErrors).filter(([field]) => field !== name));
  return Object.keys(fieldErrors).length > 0 ? { ...result, fieldErrors } : null;
}

/**
 * Envía un formulario a una Server Action que devuelve `ActionResult` y expone su estado:
 * `isPending` mientras corre, el `error` general y los `fieldErrors` para el `Form` de
 * HeroUI (`validationErrors`).
 *
 * `clearFieldError` (en el `onInput` de un campo o de un contenedor de campos: el evento burbujea)
 * borra el error de un campo en cuanto el usuario lo edita. Si se borrara al perder el foco (lo
 * que hace React Aria), el texto del error desaparecería justo al presionar el botón de enviar, el
 * botón se movería y el clic no llegaría a él.
 *
 * ```tsx
 * const form = useServerActionForm(action); // `action` llega como prop desde la page
 * <Form onSubmit={form.submit} validationErrors={form.fieldErrors}>
 *   <TextField name="gamertag"><Input onInput={form.clearFieldError} /></TextField>
 * </Form>
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

  const clearFieldError = (event: FormEvent<HTMLElement>) => {
    const field = event.target;
    if (
      field instanceof HTMLInputElement ||
      field instanceof HTMLTextAreaElement ||
      field instanceof HTMLSelectElement
    ) {
      setResult((current) => withoutFieldError(current, field.name));
    }
  };

  const failure = result && !result.ok ? result : null;
  return {
    submit,
    clearFieldError,
    isPending,
    error: failure?.error ?? null,
    fieldErrors: failure?.fieldErrors ?? NO_FIELD_ERRORS,
  };
}
