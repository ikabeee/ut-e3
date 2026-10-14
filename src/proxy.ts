import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { isAdminAuthorization } from "@shared/lib/server/admin-auth";
import { AUTH_COOKIE_NAME, decodeSessionCookie } from "@shared/lib/server/session";

function checkLoginRedirect(pathname: string, role?: string, url?: string): NextResponse | null {
  if (pathname !== "/login" || !url) return null;

  if (role === "admin") return NextResponse.redirect(new URL("/admin", url));

  if (role === "team") return NextResponse.redirect(new URL("/team", url));

  return null;
}

function checkAdminAccess(request: NextRequest, isAdmin: boolean): NextResponse {
  if (isAdmin) return NextResponse.next();

  if (isAdminAuthorization(request.headers.get("authorization"))) return NextResponse.next();

  if (request.headers.get("accept")?.includes("text/html")) {
    return NextResponse.redirect(new URL("/login?redirect=/admin", request.url));
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

function checkTeamAccess(request: NextRequest, role?: string): NextResponse {
  if (role === "team") return NextResponse.next();

  if (role === "admin") return NextResponse.redirect(new URL("/admin", request.url));

  return NextResponse.redirect(new URL("/login?redirect=/team", request.url));
}

/**
 * Middleware de protección de rutas y control de acceso por roles.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieValue = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = decodeSessionCookie(cookieValue);

  const loginRedirect = checkLoginRedirect(pathname, session?.role, request.url);

  if (loginRedirect) return loginRedirect;

  if (pathname === "/register") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/admin")) {
    return checkAdminAccess(request, session?.role === "admin");
  }

  if (pathname.startsWith("/team")) {
    return checkTeamAccess(request, session?.role);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/team", "/team/:path*", "/login", "/register"],
};
