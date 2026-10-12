import { GAMES_PATH } from "@features/games/lib/game-links";
import { SITE_COPY } from "@features/site/lib/site-copy";
import { ActionLink } from "@shared/components/action-link";

/** Página 404 con el estilo del sitio. */
export function NotFoundView() {
  const copy = SITE_COPY.notFound;

  return (
    <main className="page-wrap flex flex-col items-start gap-6 pt-[clamp(48px,8vw,120px)]">
      <p className="m-0 type-tiny text-accent">{copy.kicker}</p>
      <h1 className="type-giant">{copy.title}</h1>
      <p className="m-0 max-w-[46ch] text-copy">{copy.description}</p>
      <ActionLink href={GAMES_PATH} variant="primary" arrow="e">
        {copy.action}
      </ActionLink>
    </main>
  );
}
