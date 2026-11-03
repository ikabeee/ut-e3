import "server-only";
import { connection } from "next/server";
import { getEventSettings } from "@features/event-settings/lib/server/event-settings-queries";
import { resolveItchLink } from "@features/games/lib/itch-link";
import { getGameItch } from "@features/games/lib/server/itch-queries";

const NO_STORE = { "Cache-Control": "no-store" };

// RF-10: the link is decided here with the clock of the server, so the URL is in no page and no cache before the
// activation time. The answer is never stored, by the browser or by the service worker (which ignores /api).
export async function GET(_request: Request, context: RouteContext<"/api/games/[slug]/itch">): Promise<Response> {
  await connection();

  const { slug } = await context.params;
  const game = await getGameItch(slug);

  if (!game) return Response.json({ error: "Juego no encontrado." }, { status: 404, headers: NO_STORE });

  const { itchOpensAt } = await getEventSettings();
  const link = resolveItchLink({ itchUrl: game.itchUrl, itchOpensAt, now: new Date() });

  return Response.json({ link }, { headers: NO_STORE });
}
