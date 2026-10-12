import "server-only";
import { refresh, updateTag } from "next/cache";
import { actionError, actionOk, type ActionResult } from "@shared/lib/action-result";
import { ActionRuleError } from "@shared/lib/action-rule-error";
import { describeConstraintViolation, getConstraintViolation } from "@shared/lib/server/db-errors";
import { RecordNotFoundError } from "@shared/lib/record-not-found-error";
import { ValidationError } from "@shared/lib/validation";

export interface ServerActionOptions {
  /** Etiquetas de caché de Next.js a invalidar si la operación termina bien (`updateTag`). */
  invalidateTags?: readonly string[];
  /** Mensajes para restricciones de la base, por prefijo de su nombre (`genre_slug_key`). */
  constraintMessages?: Readonly<Record<string, string>>;
  /** Vuelve a renderizar la página actual con los datos nuevos (`refresh()`) si todo sale bien. */
  refreshPage?: boolean;
}

/**
 * Ejecuta el trabajo de una Server Action y convierte los errores esperados (validación,
 * registro no encontrado, regla de negocio, restricción de la base) en un `ActionResult`
 * con un mensaje en español. Los errores inesperados se relanzan.
 */
export async function runServerAction<T>(
  operation: () => Promise<T>,
  { invalidateTags = [], constraintMessages = {}, refreshPage = false }: ServerActionOptions = {},
): Promise<ActionResult<T>> {
  try {
    const data = await operation();
    for (const tag of invalidateTags) {
      updateTag(tag);
    }
    if (refreshPage) {
      refresh();
    }
    return actionOk(data);
  } catch (error) {
    if (error instanceof ValidationError) {
      return actionError(error.message, error.fieldErrors);
    }
    if (error instanceof RecordNotFoundError || error instanceof ActionRuleError) {
      return actionError(error.message);
    }
    const violation = getConstraintViolation(error);
    if (violation) {
      return actionError(describeConstraintViolation(violation, constraintMessages));
    }
    throw error;
  }
}
