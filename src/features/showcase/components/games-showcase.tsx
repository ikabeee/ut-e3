import type { ReactNode } from "react";
import { PixelMarquee } from "@features/showcase/components/pixel-marquee";
import { SHOWCASE_COPY } from "@features/showcase/lib/showcase-copy";
import { SHOWCASE_GAMES_SECTION_ID } from "@features/showcase/lib/showcase-links";

const { games } = SHOWCASE_COPY;

/** The games band: the LED ribbon above the games carousel (`children`). */
export function GamesShowcase({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div id={SHOWCASE_GAMES_SECTION_ID} className="section-block">
      <PixelMarquee
        text={games.marquee}
        className="mb-[clamp(20px,3vw,40px)]"
        textClassName="h-[clamp(56px,12vw,180px)] fill-foreground"
      />
      {children}
    </div>
  );
}
