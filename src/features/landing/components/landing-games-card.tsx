import Image from "next/image";
import Link from "next/link";
import { GAMES_PATH } from "@features/games/lib/game-links";
import { LandingIcon } from "@features/landing/components/landing-icon";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import type { LandingGame } from "@features/landing/lib/landing-games";

/**
 * Tarjeta de la banda oscura: personaje, nombre, género, descripción y enlace al catálogo. Las medidas
 * del Figma (471 x 476 px) van en % o en `cqw` (1 % del ancho de la tarjeta) para que escale.
 */
export function LandingGamesCard({ game }: Readonly<{ game: LandingGame }>) {
  const { name, genre, description, image } = game;

  return (
    <article className="@container relative aspect-[471/476] w-full rounded-[25.6px] bg-background text-landing-band">
      <Image
        src={image.src}
        alt=""
        width={image.width}
        height={image.height}
        sizes="(min-width: 640px) 340px, 70vw"
        className={`absolute h-auto ${image.className}`}
      />
      <div className="absolute top-[54.9%] left-[8.3%] w-[56.9%]">
        <Image src="/landing/icons/card-name-pill.svg" alt="" width={268} height={40} unoptimized className="w-full" />
        <h3 className="absolute inset-0 grid place-items-center text-[5.1cqw] font-bold text-foreground uppercase">
          {name}
        </h3>
      </div>
      <span className="absolute top-[67%] left-[8.3%] rounded-[2.5cqw] bg-landing-band px-[3cqw] py-[0.9cqw] text-[3cqw] text-background">
        {genre}
      </span>
      <p className="absolute top-[77.1%] left-[8.5%] w-[72.6%] text-[3.8cqw] leading-[1.2] capitalize">{description}</p>
      <Link
        href={GAMES_PATH}
        aria-label={LANDING_COPY.games.viewGame(name)}
        className="absolute top-[2.9%] right-[5.7%] grid size-[17cqw] place-items-center rounded-full bg-landing-band text-background"
      >
        <LandingIcon name="arrow-up-right" className="size-[27%]" />
      </Link>
    </article>
  );
}
