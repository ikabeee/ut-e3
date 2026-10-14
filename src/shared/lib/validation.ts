import type { FieldErrors } from "@shared/lib/action-result";

export type RawInputValue = string | number | boolean | null | undefined | readonly unknown[];

/** Datos de un formulario tal como llegan a una Server Action. */
export type RawInput = { readonly [key: string]: RawInputValue };

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

/** Lo lanza `validate()` cuando algún campo no es válido; `fieldErrors` dice cuál y por qué. */
export class ValidationError extends Error {
  constructor(readonly fieldErrors: FieldErrors) {
    super("Revisa los campos marcados.");
    this.name = "ValidationError";
  }
}

/** Slug en minúsculas con guiones: `ruta-9`, `accion`. */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

interface TextRule {
  label: string;
  max: number;
  pattern?: RegExp;
  /** Mensaje cuando no coincide con `pattern`. */
  patternMessage?: string;
}

/**
 * Lee y valida los campos de un formulario acumulando los errores. Las reglas de la base
 * (longitudes, formatos) se repiten aquí para responder con mensajes claros en español.
 *
 * ```ts
 * const data = validate(raw, (field) => ({ name: field.text("name", { label: "Nombre", max: 80 }) }));
 * ```
 */
export function validate<T>(raw: RawInput, read: (field: FieldReader) => T): T {
  const errors: FieldErrors = {};
  const data = read(createFieldReader(raw, errors));

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }

  return data;
}

export interface FieldReader {
  /** Texto obligatorio, sin espacios al inicio ni al final. */
  text(name: string, rule: TextRule): string;
  /** Texto opcional: vacío se guarda como `null`. */
  optionalText(name: string, rule: TextRule): string | null;
  /** Entero dentro de un rango; vacío toma `fallback`. */
  integer(name: string, rule: { label: string; min: number; max: number; fallback?: number }): number;
  boolean(name: string): boolean;
  /** Uno de los valores permitidos. */
  oneOf<V extends string>(name: string, values: readonly V[], label: string): V;
  /** Lista de textos (ids), sin repetidos. */
  list(name: string): string[];
  /** Marca un error en un campo (reglas entre campos), si ese campo no tiene ya uno. */
  invalid(name: string, message: string): void;
}

function createFieldReader(raw: RawInput, errors: FieldErrors): FieldReader {
  const readString = (name: string) => {
    const value = raw[name];

    return isString(value) ? value.trim() : "";
  };

  const checkText = (name: string, value: string, rule: TextRule) => {
    if (value.length > rule.max) {
      errors[name] = `${rule.label}: máximo ${rule.max} caracteres.`;
    } else if (rule.pattern && !rule.pattern.test(value)) {
      errors[name] = rule.patternMessage ?? `${rule.label} no tiene un formato válido.`;
    }
  };

  return {
    text(name, rule) {
      const value = readString(name);

      if (!value) {
        errors[name] = `${rule.label} es obligatorio.`;
      } else {
        checkText(name, value, rule);
      }

      return value;
    },

    optionalText(name, rule) {
      const value = readString(name);

      if (!value) return null;
      checkText(name, value, rule);

      return value;
    },

    integer(name, { label, min, max, fallback }) {
      const value = raw[name];

      if ((value === undefined || value === null || value === "") && fallback !== undefined) {
        return fallback;
      }

      const number = isNumber(value) ? value : Number(value);

      if (!Number.isInteger(number) || number < min || number > max) {
        errors[name] = `${label} debe ser un número entero entre ${min} y ${max}.`;

        return fallback ?? min;
      }

      return number;
    },

    boolean(name) {
      const value = raw[name];

      return value === true || value === "true" || value === "on";
    },

    oneOf(name, values, label) {
      const value = readString(name);
      const match = values.find((candidate) => candidate === value);

      if (!match) {
        errors[name] = `Elige un valor válido para ${label}.`;

        return values[0];
      }

      return match;
    },

    list(name) {
      const value = raw[name];
      const items = Array.isArray(value) ? value : [value];

      return [...new Set(items.filter((item): item is string => typeof item === "string" && item.trim() !== ""))];
    },

    invalid(name, message) {
      errors[name] ??= message;
    },
  };
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** `true` si el valor es un UUID (los ids de la base). */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}
