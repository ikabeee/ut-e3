import "server-only";
import { getStandAccount } from "@features/accounts/lib/server/current-account";
import { getPinFilter } from "@features/stands/lib/server/pin-filter-queries";

// The response is private to the session: no shared cache keeps it, and the kiosk saves its own copy.
const PRIVATE = { "Cache-Control": "private, no-store" };

// Only a stand session downloads the filter of the PINs (RF-78, RNF-19); a visitor or the public get 401.
export async function GET(): Promise<Response> {
  const account = await getStandAccount();

  if (!account) return Response.json({ error: "Sin sesión de stand." }, { status: 401, headers: PRIVATE });

  return Response.json(await getPinFilter(), { headers: PRIVATE });
}
