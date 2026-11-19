import "server-only";
import type { RequestErrorRoute, RequestErrorSource } from "@shared/lib/server/emergency-alert";
import { logServerEvent } from "@shared/lib/server/server-log";

/**
 * An error that Next.js caught in a request, in the server logs. It names the route file, never the visited path or its
 * query, which can hold a token (like describeRequestError for the emergency email). The free message of the error is
 * never stored (it can carry an address or a token): only its class. `digest` is the id Next.js gives the error.
 */
export async function logRequestError(
  cause: unknown,
  request: RequestErrorSource,
  route: RequestErrorRoute,
): Promise<void> {
  const isError = cause instanceof Error;

  await logServerEvent("error", "request", `Request error: ${isError ? cause.name : "NonError"}`, {
    route: route.routePath,
    routeType: route.routeType,
    method: request.method,
    digest: isError && "digest" in cause ? String(cause.digest) : undefined,
  });
}
