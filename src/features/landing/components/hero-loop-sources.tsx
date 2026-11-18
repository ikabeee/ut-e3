import { HERO_LOOP } from "@features/landing/lib/hero-loop";

interface HeroLoopSourcesProps {
  hasSource: boolean;
}

/** The `<source>` list of the hero loop video, empty until the playback hook allows loading it. */
export function HeroLoopSources({ hasSource }: Readonly<HeroLoopSourcesProps>) {
  if (!hasSource) return null;

  return HERO_LOOP.sources.map((source) => <source key={source.src} src={source.src} type={source.type} />);
}
