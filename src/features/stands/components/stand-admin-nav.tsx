import Link from "next/link";
import { buttonVariants } from "@heroui/react";
import { STAND_HOME_PATH } from "@features/accounts/lib/accounts-links";
import { STAND_GAME_PATH } from "@features/games/lib/games-links";
import { STAND_TEAM_PATH } from "@features/stands/lib/stands-links";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";

const COPY = STANDS_COPY.adminNav;

const LINKS = [
  { href: STAND_HOME_PATH, label: COPY.kiosk },
  { href: STAND_GAME_PATH, label: COPY.game },
  { href: STAND_TEAM_PATH, label: COPY.team },
];

/** The three screens of the stand administrator; the staff of the stand only has the kiosk (RF-33). */
export function StandAdminNav() {
  return (
    <nav aria-label={COPY.label} className="flex flex-wrap gap-3">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={buttonVariants({ variant: "outline", className: "min-h-11" })}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
