import "server-only";
import { NextResponse } from "next/server";
import { PASSPORT_PATH, REGISTER_PATH } from "@features/visitors/lib/visitors-links";
import { isActiveDeviceToken, setVisitorDeviceCookie } from "@shared/lib/server/visitor-device";

// Public on purpose: the token in the link is the proof. A phone that opens it becomes the device of the passport; a
// token that was replaced since (another recovery) or never existed sends the visitor to register, like no cookie does.
export async function GET(request: Request, context: RouteContext<"/passport/claim/[token]">): Promise<Response> {
  const { token } = await context.params;
  const valid = await isActiveDeviceToken(token);

  if (valid) {
    await setVisitorDeviceCookie(token);
  }

  return NextResponse.redirect(new URL(valid ? PASSPORT_PATH : REGISTER_PATH, request.url), {
    headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
}
