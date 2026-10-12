import type { ExampleMessage } from "@features/example/lib/types";

/** Ruta pública del Route Handler (`api/example-route.ts`). */
export const EXAMPLE_API_PATH = "/api/example";

/**
 * Valida el JSON de la respuesta antes de usarlo como tipo de dominio. Si lo que viaja por HTTP
 * llega a ser distinto del tipo de dominio, sepáralo en `api/<feature>-contract.ts` como en `games`.
 */
export function parseExampleMessage(value: unknown): ExampleMessage {
  const message = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  if (typeof message.title !== "string" || typeof message.description !== "string") {
    throw new Error("La respuesta de la API de ejemplo no tiene el formato esperado.");
  }
  return { title: message.title, description: message.description };
}

/** Lee el mensaje desde el Route Handler. Se usa en el navegador (por ejemplo, como `queryFn`). */
export async function fetchExampleMessage(): Promise<ExampleMessage> {
  const response = await fetch(EXAMPLE_API_PATH);
  if (!response.ok) {
    throw new Error(`No se pudo cargar el mensaje (${response.status}).`);
  }
  return parseExampleMessage(await response.json());
}
