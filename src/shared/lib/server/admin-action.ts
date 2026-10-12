import "server-only";
import { actionError, type ActionResult } from "@shared/lib/action-result";
import { ADMIN_UNAUTHORIZED_MESSAGE, isAdminRequest } from "@shared/lib/server/admin-auth";
import { runServerAction, type ServerActionOptions } from "@shared/lib/server/server-action";

/**
 * Esqueleto de toda Server Action de administración:
 * 1. Rechaza la petición si no viene de un administrador.
 * 2. Ejecuta la operación (validación + consulta).
 * 3. Invalida la caché del sitio para que los visitantes vean el cambio y vuelve a renderizar la
 *    página del panel (`refresh()`), para que sus listas muestren el cambio.
 * 4. Convierte los errores esperados (validación, no encontrado, duplicados) en un
 *    `ActionResult` con un mensaje en español; los inesperados se relanzan.
 */
export async function runAdminAction<T>(
  operation: () => Promise<T>,
  options: ServerActionOptions = {},
): Promise<ActionResult<T>> {
  if (!(await isAdminRequest())) {
    return actionError(ADMIN_UNAUTHORIZED_MESSAGE);
  }
  return runServerAction(operation, { refreshPage: true, ...options });
}
