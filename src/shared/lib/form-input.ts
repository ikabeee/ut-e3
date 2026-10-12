import type { RawInput } from "@shared/lib/validation";

/**
 * Convierte un `FormData` en los datos que reciben las Server Actions. Los campos repetidos
 * (casillas con el mismo `name`) llegan como lista; los archivos se descartan.
 */
export function formDataToInput(formData: FormData): RawInput {
  const input: RawInput = {};
  for (const name of new Set(formData.keys())) {
    const values = formData.getAll(name).filter((value): value is string => typeof value === "string");
    input[name] = values.length > 1 ? values : (values[0] ?? "");
  }
  return input;
}
