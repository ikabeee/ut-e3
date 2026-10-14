import Link from "next/link";
import { Boxes3 } from "@gravity-ui/icons";
import { cn } from "@heroui/react";
import { getPlanItemPath } from "@features/floor-plan/lib/floor-plan-links";
import type { PassportGame } from "@features/visitors/lib/types";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { EmptyState } from "@shared/components/empty-state";

interface PassportGameListProps {
  games: readonly PassportGame[];
}

/** Juegos que cuentan para el boleto, marcados si ya se probaron; enlazan a su stand en el croquis. */
export function PassportGameList({ games }: Readonly<PassportGameListProps>) {
  const copy = VISITORS_COPY.games;

  if (games.length === 0) {
    return <EmptyState icon={Boxes3} title={copy.empty} />;
  }

  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-px border border-border bg-border p-0 max-[560px]:grid-cols-1">
      {games.map((game) => (
        <li key={game.slug} className="bg-background">
          <Link
            href={getPlanItemPath(game.standCode)}
            className="flex min-h-11 items-center gap-3 px-[14px] py-3 no-underline hover:text-accent"
          >
            <span
              aria-hidden="true"
              className={cn(
                "grid size-6 shrink-0 place-items-center border",
                game.isChecked ? "border-accent bg-accent text-accent-foreground" : "border-border text-muted",
              )}
            >
              {game.isChecked ? (
                <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 8.5l3 3 7-7" />
                </svg>
              ) : null}
            </span>
            <span className="flex min-w-0 flex-col">
              <b className="truncate text-[15px]">{game.name}</b>
              <span className="type-tiny text-muted">
                {copy.stand(game.standCode)} · {game.isChecked ? copy.checked : copy.pending}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
