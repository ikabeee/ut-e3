import { NextResponse, type NextRequest } from "next/server";
import { LOGIN_PATH } from "@features/accounts/lib/accounts-links";
import { SESSION_COOKIE } from "@shared/lib/session-cookie";

// Optimistic check only (no database in the proxy): the page and every Server Action validate the session again.
export function redirectWithoutSession(request: NextRequest): NextResponse {
  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL(LOGIN_PATH, request.nextUrl));
}
