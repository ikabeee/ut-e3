import { isPublicSnapshot, type PublicSnapshot } from "@features/tournament/lib/public-bracket";

export const PUBLIC_BRACKET_API_PATH = "/api/tournament/public";

/** Asks the public endpoint for the bracket; the answer is never taken from the browser cache. */
export async function fetchPublicSnapshot(): Promise<PublicSnapshot> {
  const response = await fetch(PUBLIC_BRACKET_API_PATH, { cache: "no-store" });

  if (!response.ok) throw new Error(`El servidor respondió ${response.status}.`);

  const body: unknown = await response.json();

  if (!isPublicSnapshot(body)) throw new Error("La respuesta del servidor no es un bracket válido.");

  return body;
}
