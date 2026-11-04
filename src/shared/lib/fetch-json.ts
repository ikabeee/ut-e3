/**
 * GETs a JSON endpoint from the browser, never from its cache, and parses the body at the border: what comes back is
 * the type the guard proves, never `unknown`.
 */
export async function fetchJson<Body>(path: string, isBody: (value: unknown) => value is Body): Promise<Body> {
  const response = await fetch(path, { cache: "no-store" });

  if (!response.ok) throw new Error(`El servidor respondió ${response.status}.`);

  const body: unknown = await response.json();

  if (!isBody(body)) throw new Error("La respuesta del servidor no es válida.");

  return body;
}
