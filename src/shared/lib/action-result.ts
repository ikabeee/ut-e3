/** Errores por campo de un formulario: `{ name: "Escribe el nombre." }`. */
export type FieldErrors = Record<string, string>;

/**
 * Respuesta de una Server Action. Las acciones no lanzan errores esperados (validación,
 * permisos, duplicados): los devuelven aquí para que el formulario los muestre.
 */
export type ActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; error: string; fieldErrors?: FieldErrors };

export function actionOk<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function actionError(error: string, fieldErrors?: FieldErrors): ActionResult<never> {
  return fieldErrors ? { ok: false, error, fieldErrors } : { ok: false, error };
}
