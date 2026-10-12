import "server-only";
import { updateTag } from "next/cache";
import { actionError, actionOk, type ActionResult } from "@shared/lib/action-result";
import { ADMIN_UNAUTHORIZED_MESSAGE, isAdminRequest } from "@shared/lib/server/admin-auth";
import { describeConstraintViolation, getConstraintViolation } from "@shared/lib/server/db-errors";
import { RecordNotFoundError } from "@shared/lib/record-not-found-error";
import { ValidationError } from "@shared/lib/validation";

interface AdminActionOptions {
  /** Etiquetas de caché de Next.js a invalidar si el cambio se guarda (`updateTag`). */
  invalidateTags?: readonly string[];
  /** Mensajes para restricciones de la base, por prefijo de su nombre (`genre_slug_key`). */
  constraintMessages?: Readonly<Record<string, string>>;
}

/**
 * Esqueleto de toda Server Action de administración:
 * 1. Rechaza la petición si no viene de un administrador.
 * 2. Ejecuta la operación (validación + consulta).
 * 3. Invalida la caché del sitio para que los visitantes vean el cambio.
 * 4. Convierte los errores esperados (validación, no encontrado, duplicados) en un
 *    `ActionResult` con un mensaje en español; los inesperados se relanzan.
 */
export async function runAdminAction<T>(
  operation: () => Promise<T>,
  { invalidateTags = [], constraintMessages = {} }: AdminActionOptions = {},
): Promise<ActionResult<T>> {
  if (!(await isAdminRequest())) {
    return actionError(ADMIN_UNAUTHORIZED_MESSAGE);
  }

  try {
    const data = await operation();
    for (const tag of invalidateTags) {
      updateTag(tag);
    }
    return actionOk(data);
  } catch (error) {
    if (error instanceof ValidationError) {
      return actionError(error.message, error.fieldErrors);
    }
    if (error instanceof RecordNotFoundError) {
      return actionError(error.message);
    }
    const violation = getConstraintViolation(error);
    if (violation) {
      return actionError(describeConstraintViolation(violation, constraintMessages));
    }
    throw error;
  }
}
