import "server-only";
import { getSessionAccount } from "@shared/lib/server/session";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * The answer for a file with personal data when the session is not the sysadmin's: 401, not a redirect, because the
 * caller is a download. Null when the sysadmin is signed in.
 */
export async function refuseUnlessSysadmin(): Promise<Response | null> {
  const account = await getSessionAccount();

  if (account?.role === "sysadmin") return null;

  return Response.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
}

/** A CSV as a download that no cache keeps; the BOM makes Excel read it as UTF-8. */
export function csvDownload(csv: string, filename: string): Response {
  return new Response(`\uFEFF${csv}`, {
    headers: {
      ...NO_STORE,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
