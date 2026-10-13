import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { isAdminAuthorization } from "@shared/lib/server/admin-auth";

/**
 * Pide usuario y contraseña (HTTP Basic, `ADMIN_USER` y `ADMIN_PASSWORD`) en el panel de
 * administración. El navegador los recuerda y los reenvía en cada página y Server Action del
 * panel; las acciones y las páginas los vuelven a comprobar, así que esto es la primera barrera,
 * no la única.
 */
export function proxy(request: NextRequest) {
  if (isAdminAuthorization(request.headers.get("authorization"))) {
    return NextResponse.next();
  }

  return new NextResponse(ADMIN_COPY.unauthorized, {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="UTG admin", charset="UTF-8"',
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

// Constantes literales: Next las analiza en el build (deben coincidir con `ADMIN_PATH`).
export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
