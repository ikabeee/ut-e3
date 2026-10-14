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

const KIND_BY_SQL_STATE = {
  "23505": "unique",
  "23514": "check",
  "23503": "foreign-key",
  "23502": "not-null",
} as const satisfies Record<string, ConstraintKind>;

interface DatabaseErrorPayload {
  readonly sqlState?: unknown;
  readonly code?: unknown;
  readonly constraint?: unknown;
  readonly cause?: unknown;
}

function isDatabaseErrorPayload(value: unknown): value is DatabaseErrorPayload {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

type SqlState = keyof typeof KIND_BY_SQL_STATE;

function isSqlState(value: unknown): value is SqlState {
  return isString(value) && value in KIND_BY_SQL_STATE;
}

/** Devuelve la restricción violada, o `null` si el error es de otro tipo. */
export function getConstraintViolation(cause: unknown): ConstraintViolation | null {
  let current: unknown = cause;

  for (let depth = 0; depth < 4 && isDatabaseErrorPayload(current); depth += 1) {
    const rawCode = isString(current.sqlState) ? current.sqlState : current.code;

    if (isSqlState(rawCode)) {
      const kind = KIND_BY_SQL_STATE[rawCode];
      const constraint = isString(current.constraint) ? current.constraint : "";

      return { kind, constraint };
    }

    current = current.cause;
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
