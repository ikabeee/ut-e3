import { GameCoverflow } from "@features/games/components/game-coverflow";
import { HOME_COPY } from "@features/home/lib/home-copy";

/** "Explora el catálogo" con el exhibidor 3D de juegos (`#games`). */
export function CatalogShowcase() {
  return (
    <section id="games" className="section-block">
      <div className="page-wrap">
        <h2 className="text-center type-giant text-[clamp(24px,4.6vw,68px)]!">{HOME_COPY.catalogHeading}</h2>
      </div>
      <GameCoverflow />
    </section>
  );
}
