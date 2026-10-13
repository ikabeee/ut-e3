/**
 * Errores de PostgreSQL que la aplicación traduce a mensajes para el usuario.
 * Prisma 8 los lanza como `SqlQueryError` con el código de PostgreSQL (`sqlState`) y el
 * nombre de la restricción.
 */
export type ConstraintKind = "unique" | "check" | "foreign-key" | "not-null";

export interface ConstraintViolation {
  kind: ConstraintKind;
  /** Nombre de la restricción, por ejemplo `genre_slug_key` o `game_slug_format_a2990fec`. */
  constraint: string;
}

const KIND_BY_SQL_STATE: Record<string, ConstraintKind> = {
  "23505": "unique",
  "23514": "check",
  "23503": "foreign-key",
  "23502": "not-null",
};

interface SqlErrorShape {
  sqlState?: unknown;
  code?: unknown;
  constraint?: unknown;
  cause?: unknown;
}

/** Devuelve la restricción violada, o `null` si el error es de otro tipo. */
export function getConstraintViolation(error: unknown): ConstraintViolation | null {
  let current: unknown = error;

  for (let depth = 0; depth < 4 && typeof current === "object" && current !== null; depth++) {
    const candidate = current as SqlErrorShape;
    const sqlState = typeof candidate.sqlState === "string" ? candidate.sqlState : candidate.code;
    const kind = typeof sqlState === "string" ? KIND_BY_SQL_STATE[sqlState] : undefined;

    if (kind) {
      return { kind, constraint: typeof candidate.constraint === "string" ? candidate.constraint : "" };
    }

    current = candidate.cause;
  }

  return null;
}

/**
 * Mensaje para una restricción violada. Las claves de `messages` son prefijos del nombre de
 * la restricción (los `CHECK` llevan un sufijo con hash).
 */
export function describeConstraintViolation(
  violation: ConstraintViolation,
  messages: Readonly<Record<string, string>>,
): string {
  const match = Object.keys(messages).find((prefix) => violation.constraint.startsWith(prefix));

  if (match) return messages[match];

  switch (violation.kind) {
    case "unique":
      return "Ya existe un registro con esos datos.";
    case "foreign-key":
      return "No se puede completar porque hay registros relacionados.";
    default:
      return "Los datos no cumplen las reglas de la base de datos.";
  }
}
