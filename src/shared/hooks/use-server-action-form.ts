import { useState, useTransition, type SyntheticEvent } from "react";
import { toast } from "@heroui/react";
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
 * Los errores generales se muestran automáticamente mediante un toast de peligro (`toast.danger`).
 *
 * `clearFieldError` (en el `onInput` de un campo o de un contenedor de campos: el evento burbujea)
 * borra el error de un campo en cuanto el usuario lo edita.
 */
export function useServerActionForm<T>(action: FormAction<T>, onSuccess?: (data: T) => void) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<T> | null>(null);

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = formDataToInput(new FormData(event.currentTarget));

    startTransition(async () => {
      try {
        const next = await action(input);
        setResult(next);

        if (next.ok) {
          onSuccess?.(next.data);
        } else if (next.error) {
          toast.danger(next.error);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Ocurrió un error inesperado al procesar la solicitud.";
        setResult({ ok: false, error: message });
        toast.danger(message);
      }
    });
  };

  const clearFieldError = (event: SyntheticEvent<HTMLElement>) => {
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
