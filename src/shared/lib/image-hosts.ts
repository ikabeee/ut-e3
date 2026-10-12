/**
 * Dominios desde los que el sitio acepta fotos de juegos por URL https.
 *
 * `next/image` sólo optimiza imágenes de los dominios configurados en `next.config.ts`;
 * una foto de otro dominio rompería la página. Por eso la misma lista se usa en la
 * configuración y en la validación del panel. Se define en `IMAGE_REMOTE_HOSTS`, separada
 * por comas (por ejemplo `utg.blob.vercel-storage.com,img.itch.zone`), y la lee `env.ts`
 * (`env.imageRemoteHosts`). Cambiarla requiere volver a hacer el build.
 */
export function parseImageHosts(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
}

/** Ruta del sitio (`/mock/games/...`) o URL https de un dominio permitido. */
export function isAllowedImageUrl(url: string, hosts: readonly string[]) {
  if (/^\/[^/]/.test(url)) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && hosts.includes(parsed.hostname);
  } catch {
    return false;
  }
}
