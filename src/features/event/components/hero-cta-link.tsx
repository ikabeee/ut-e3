import { ScrambleText } from "@shared/components/scramble-text";

interface HeroCtaLinkProps {
  href: string;
  children: string;
}

const GLYPH = "↗";
const GLYPH_CLASS = "grid size-5 place-items-center font-mono text-lg leading-none font-bold";
const SLICE_CLASS = `${GLYPH_CLASS} pointer-events-none absolute top-1/2 left-1/2 -mt-2.5 -ml-2.5 opacity-0`;

/**
 * Llamado principal del encabezado (`.hero-cta`): bloque blanco que se rellena de azul y
 * una flecha con interferencia (una capa que tiembla y dos cortes desplazados).
 */
export function HeroCtaLink({ href, children }: Readonly<HeroCtaLinkProps>) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group fill-wipe inline-flex items-stretch p-0 font-mono text-sm font-bold text-background uppercase no-underline [--wipe-base:var(--utg-white)] [--wipe-fill:var(--accent)] [--wipe-ink:var(--utg-black)] max-[760px]:flex-[1_1_100%] max-[760px]:justify-between max-[640px]:self-stretch"
    >
      <ScrambleText text={children} className="flex items-center px-5 py-4" />
      <span
        aria-hidden="true"
        className="relative grid w-[52px] place-items-center bg-accent text-background transition-colors duration-200 group-hover:bg-background group-hover:text-accent"
      >
        <span className={`${GLYPH_CLASS} glitch-layer-base group-hover:[animation-duration:.5s]`}>{GLYPH}</span>
        <span className={`${SLICE_CLASS} glitch-layer-a text-accent-deep group-hover:[animation-duration:.5s]`}>{GLYPH}</span>
        <span className={`${SLICE_CLASS} glitch-layer-b text-accent-hi group-hover:[animation-duration:.5s]`}>{GLYPH}</span>
      </span>
    </a>
  );
}
