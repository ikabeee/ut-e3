import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { isAdminAuthorization } from "@shared/lib/server/admin-auth";
import { AUTH_COOKIE_NAME, decodeSessionCookie, type SessionPayload } from "@shared/lib/server/session";

function checkLoginRedirect(
  pathname: string,
  session?: SessionPayload | null,
  url?: string,
  isLogout?: boolean,
): NextResponse | null {
  if (pathname !== "/login" || !url || isLogout) return null;

  if (session?.role === "admin") return NextResponse.redirect(new URL("/admin", url));

  if (session?.role === "team" && session.teamId) return NextResponse.redirect(new URL("/team", url));

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

function checkTeamAccess(request: NextRequest, session?: SessionPayload | null): NextResponse {
  if (session?.role === "team" && session.teamId) return NextResponse.next();

  if (session?.role === "admin") return NextResponse.redirect(new URL("/admin", request.url));

  return NextResponse.redirect(new URL("/login?redirect=/team", request.url));
}

/**
 * Middleware de protección de rutas y control de acceso por roles.
 */
export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const cookieValue = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = decodeSessionCookie(cookieValue);
  const isLogout = searchParams.get("logout") === "true";

  if (pathname === "/login" && isLogout) {
    const response = NextResponse.next();
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }

  const loginRedirect = checkLoginRedirect(pathname, session, request.url, isLogout);

  if (loginRedirect) return loginRedirect;

  if (pathname === "/register") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/admin")) {
    return checkAdminAccess(request, session?.role === "admin");
  }

  if (pathname.startsWith("/team")) {
    return checkTeamAccess(request, session);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/team", "/team/:path*", "/login", "/register"],
};
