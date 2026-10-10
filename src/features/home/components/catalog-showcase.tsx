import { GameCoverflow } from "@features/games/components/game-coverflow";

/** "Explora el catálogo" con el exhibidor 3D de juegos (`#juegos`). */
export function CatalogShowcase() {
  return (
    <section id="juegos" className="section-block">
      <div className="page-wrap">
        <h2 className="type-giant text-center text-[clamp(24px,4.6vw,68px)]!">Explora el catálogo</h2>
      </div>
      <GameCoverflow />
    </section>
  );
}
