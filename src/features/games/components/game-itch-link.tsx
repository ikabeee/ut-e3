import { GAMES_COPY } from "@features/games/lib/games-copy";
import type { ItchLink } from "@features/games/lib/itch-link";
import { ActionLink } from "@shared/components/action-link";
import { formatTimeOfDay } from "@shared/lib/date-time";

interface GameItchLinkProps {
  link: ItchLink;
}

export function GameItchLink({ link }: Readonly<GameItchLinkProps>) {
  if (link.status === "hidden") return null;

  if (link.status === "pending") {
    return <p className="type-mono text-muted">{GAMES_COPY.detail.itchPending(formatTimeOfDay(link.opensAt))}</p>;
  }

  return (
    <ActionLink href={link.url} variant="primary" arrow="ne" isExternal fullWidth>
      {GAMES_COPY.detail.itchOpen}
    </ActionLink>
  );
}
