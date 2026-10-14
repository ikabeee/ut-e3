import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COPY } from "@features/auth/lib/auth-copy";
import { ADMIN_PORTAL_PATH, LOGIN_PATH, REGISTER_PATH, TEAM_PORTAL_PATH } from "@features/auth/lib/auth-links";
import { isAdminAuthorization } from "@shared/lib/server/admin-auth";
import { AUTH_COOKIE_NAME, decodeSessionCookie, type SessionPayload } from "@shared/lib/server/session";

export function checkLoginRedirect(
  pathname: string,
  session?: SessionPayload | null,
  url?: string,
  isLogout?: boolean,
): NextResponse | null {
  if (pathname !== LOGIN_PATH || !url || isLogout) {
    return null;
  }

  if (session?.role === "admin") {
    return NextResponse.redirect(new URL(ADMIN_PORTAL_PATH, url));
  }

  if (session?.role === "team" && session.teamId) {
    return NextResponse.redirect(new URL(TEAM_PORTAL_PATH, url));
  }

  return null;
}

export function checkAdminAccess(request: NextRequest, session?: SessionPayload | null): NextResponse {
  if (session?.role === "admin") {
    return NextResponse.next();
  }

  if (session?.role === "team") {
    return NextResponse.redirect(new URL(TEAM_PORTAL_PATH, request.url));
  }

  if (isAdminAuthorization(request.headers.get("authorization"))) {
    return NextResponse.next();
  }

  if (request.headers.get("accept")?.includes("text/html")) {
    return NextResponse.redirect(new URL(`${LOGIN_PATH}?redirect=${request.nextUrl.pathname}`, request.url));
  }

  return new NextResponse(AUTH_COPY.session.unauthorized, {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="UTG admin", charset="UTF-8"',
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export function checkTeamAccess(request: NextRequest, session?: SessionPayload | null): NextResponse {
  if (session?.role === "team" && session.teamId) {
    return NextResponse.next();
  }

  if (session?.role === "admin") {
    return NextResponse.redirect(new URL(ADMIN_PORTAL_PATH, request.url));
  }

  return NextResponse.redirect(new URL(`${LOGIN_PATH}?redirect=${request.nextUrl.pathname}`, request.url));
}

/**
 * Middleware de protección de rutas y control de acceso por roles.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname, searchParams } = request.nextUrl;
  const cookieValue = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = decodeSessionCookie(cookieValue);
  const isLogout = searchParams.get("logout") === "true";

  if (pathname === LOGIN_PATH && isLogout) {
    const response = NextResponse.next();
    response.cookies.delete(AUTH_COOKIE_NAME);

    return response;
  }

  const loginRedirect = checkLoginRedirect(pathname, session, request.url, isLogout);

  if (loginRedirect) {
    return loginRedirect;
  }

  if (pathname === REGISTER_PATH) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  if (pathname.startsWith(ADMIN_PORTAL_PATH)) {
    return checkAdminAccess(request, session);
  }

  if (pathname.startsWith(TEAM_PORTAL_PATH)) {
    return checkTeamAccess(request, session);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/team", "/team/:path*", "/login", "/register"],
};
