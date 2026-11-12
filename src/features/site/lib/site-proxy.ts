import { NextResponse, type NextRequest } from "next/server";
import { redirectWithoutSession } from "@features/accounts/lib/accounts-proxy";
import { HOME_PATH } from "@features/landing/lib/landing-links";
import { decideSiteAccess, READ_METHODS } from "@features/site/lib/site-access";
import { STAFF_AREAS } from "@features/site/lib/staff-areas";
import { siteMode, type SiteMode } from "@shared/lib/site-mode";

/** The proxy of every request (src/proxy.ts): first the kill switch, then the session check of the staff areas. */
export function proxy(request: NextRequest): NextResponse {
  return proxySiteRequest(request, siteMode);
}

export function proxySiteRequest(request: NextRequest, mode: SiteMode): NextResponse {
  const { pathname } = request.nextUrl;

  switch (decideSiteAccess(mode, { method: request.method, pathname })) {
    case "redirectHome":
      return NextResponse.redirect(new URL(HOME_PATH, request.nextUrl));
    case "notFound":
      return new NextResponse(null, { status: 404 });
    case "methodNotAllowed":
      return new NextResponse(null, { status: 405, headers: { allow: READ_METHODS.join(", ") } });
    case "allow":
      return isStaffArea(pathname) ? redirectWithoutSession(request) : NextResponse.next();
  }
}

function isStaffArea(pathname: string): boolean {
  return STAFF_AREAS.some((area) => pathname === area || pathname.startsWith(`${area}/`));
}
