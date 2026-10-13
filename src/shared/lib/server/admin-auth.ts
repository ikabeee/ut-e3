import "server-only";
import { headers } from "next/headers";
import { env, type AdminCredentials } from "@shared/lib/env";
import { safeEqual } from "@shared/lib/server/secrets";

/**
 * Autorización de las Server Actions de administración.
 *
 * Las Server Actions son endpoints públicos, así que cada acción de escritura del catálogo
 * comprueba las credenciales antes de tocar la base. Se usan las de HTTP Basic
 * (`ADMIN_USER` y `ADMIN_PASSWORD` en el entorno): `src/proxy.ts` las pide en `/admin` y el
 * navegador las reenvía en cada acción. Sin las variables configuradas, todas las acciones se
 * rechazan.
 */
export const ADMIN_UNAUTHORIZED_MESSAGE = "No tienes permiso para hacer cambios.";

/** `true` si el encabezado `Authorization` trae el usuario y la contraseña esperados. */
export function matchesBasicCredentials(authorization: string | null, user: string, password: string) {
  if (!authorization?.startsWith("Basic ")) return false;
  const decoded = Buffer.from(authorization.slice("Basic ".length), "base64").toString("utf8");
  const separator = decoded.indexOf(":");

  if (separator === -1) return false;
  // Ambas comparaciones se hacen siempre para no revelar cuál falló por el tiempo de respuesta.
  const userMatches = safeEqual(decoded.slice(0, separator), user);
  const passwordMatches = safeEqual(decoded.slice(separator + 1), password);

  return userMatches && passwordMatches;
}

/**
 * `true` si el encabezado `Authorization` es de un administrador. Sin credenciales configuradas,
 * nunca. Lo usan `proxy.ts` (para pedir usuario y contraseña en `/admin`) e `isAdminRequest`.
 */
export function isAdminAuthorization(authorization: string | null, credentials: AdminCredentials | null = env.admin) {
  if (!credentials) return false;

  return matchesBasicCredentials(authorization, credentials.user, credentials.password);
}

/** `true` si la petición actual viene de un administrador. Sin credenciales configuradas, nunca. */
export async function isAdminRequest(credentials: AdminCredentials | null = env.admin) {
  const requestHeaders = await headers();

  return isAdminAuthorization(requestHeaders.get("authorization"), credentials);
}
