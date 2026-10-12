import "server-only";
import { NextResponse } from "next/server";
import { getVisitorCookieOptions } from "@features/visitors/lib/server/visitor-session";
import { findVisitorByToken } from "@features/visitors/lib/server/visitors-queries";
import { VISITOR_COOKIE } from "@features/visitors/lib/visitor-rules";
import { PASSPORT_PATH, UNKNOWN_QR_PASSPORT_PATH } from "@features/visitors/lib/visitors-links";

/**
 * `GET /v/<token>` (`src/app/v/[token]/route.ts` sólo lo re-exporta): abrir el QR personal (por
 * ejemplo, desde la captura de pantalla) guarda el token en la cookie y lleva al pasaporte.
 * `Referrer-Policy: no-referrer` evita que el token se filtre a otros sitios.
 */
export async function GET(_request: Request, context: RouteContext<"/v/[token]">) {
  const token = (await context.params).token.toLowerCase();
  const visitor = await findVisitorByToken(token);

  // Redirección relativa: funciona igual detrás de un proxy o entrando por la IP de la red local.
  const response = new NextResponse(null, {
    status: 303,
    headers: {
      Location: visitor ? PASSPORT_PATH : UNKNOWN_QR_PASSPORT_PATH,
      "Referrer-Policy": "no-referrer",
      "Cache-Control": "no-store",
    },
  });
  if (visitor) {
    response.cookies.set(VISITOR_COOKIE, token, getVisitorCookieOptions());
  }
  return response;
}
