import "server-only";
import { cookies } from "next/headers";
import { isVisitorToken, VISITOR_COOKIE, VISITOR_COOKIE_MAX_AGE_SECONDS } from "@features/visitors/lib/visitor-rules";
import { siteConfig } from "@shared/lib/site-config";

// El token del QR vive en una cookie httpOnly: ningún script de la página puede leerlo y no
// se copia a localStorage. Si el navegador la pierde, abrir el QR (`/v/<token>`) la restaura.

/** Opciones de la cookie del visitante. `Secure` cuando el sitio se sirve por https. */
export function getVisitorCookieOptions() {
  return {
    httpOnly: true,
    secure: siteConfig.url.startsWith("https://"),
    sameSite: "lax" as const,
    path: "/",
    maxAge: VISITOR_COOKIE_MAX_AGE_SECONDS,
  };
}

/** Token del visitante de esta petición, o `null` si no se ha registrado en este navegador. */
export async function getVisitorToken() {
  const token = (await cookies()).get(VISITOR_COOKIE)?.value;
  return isVisitorToken(token) ? token : null;
}

/** Guarda el token en la cookie (Server Actions). */
export async function saveVisitorToken(token: string) {
  (await cookies()).set(VISITOR_COOKIE, token, getVisitorCookieOptions());
}
