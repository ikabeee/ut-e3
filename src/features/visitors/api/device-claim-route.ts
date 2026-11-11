import "server-only";
import { NextResponse } from "next/server";
import { isUsableRecoveryToken } from "@features/visitors/lib/server/email-recovery";
import {
  PASSPORT_PATH,
  RECOVERY_CONFIRM_PATH,
  RECOVERY_LINK_EXPIRED_PATH,
} from "@features/visitors/lib/visitors-links";
import { parseSiteUrl } from "@shared/lib/env";
import { isActiveDeviceToken, setVisitorDeviceCookie } from "@shared/lib/server/visitor-device";

const HEADERS = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };

// Public on purpose: the token in the link is the proof. Two kinds of link land here:
// - the help desk link (RF-69) is the token of the device it issued, valid until another recovery replaces it;
// - the email link (RF-68) is a one-use recovery token. A GET never spends it (mail scanners follow links): it goes
//   to the confirmation page with the token in the fragment, and the visitor's tap there uses it.
// Anything else (expired, used, replaced or made up) goes to the page that asks for a new link, without a cookie.
export async function GET(request: Request, context: RouteContext<"/passport/claim/[token]">): Promise<Response> {
  const { token } = await context.params;

  if (await isActiveDeviceToken(token)) {
    await setVisitorDeviceCookie(token);

    return redirectTo(PASSPORT_PATH, request);
  }

  if (await isUsableRecoveryToken(token, new Date())) {
    return redirectTo(`${RECOVERY_CONFIRM_PATH}#${encodeURIComponent(token)}`, request);
  }

  return redirectTo(RECOVERY_LINK_EXPIRED_PATH, request);
}

// Behind a proxy or a tunnel `request.url` carries the internal origin (http://localhost:3000), which the visitor's phone
// cannot reach. The public origin is the one the emails use (NEXT_PUBLIC_SITE_URL); without it, the request decides.
function redirectTo(path: string, request: Request): Response {
  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const origin = publicSiteUrl ? parseSiteUrl(publicSiteUrl, process.env.NODE_ENV) : request.url;

  return NextResponse.redirect(new URL(path, origin), { headers: HEADERS });
}
