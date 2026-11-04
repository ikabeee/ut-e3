import type { ReactNode } from "react";
import { PixelMarquee } from "@features/studio/components/pixel-marquee";
import { STUDIO_COPY } from "@features/studio/lib/studio-copy";
import { STUDIO_WORK_SECTION_ID } from "@features/studio/lib/studio-links";

const { work } = STUDIO_COPY;

/** "Nuestros juegos": the LED ribbon, the introduction and the filterable carousel (`children`). */
export function WorkSection({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <section
      id={STUDIO_WORK_SECTION_ID}
      aria-labelledby="work-heading"
      className="bg-paper section-block pb-[clamp(56px,8vw,120px)] text-paper-foreground"
    >
      <PixelMarquee text={work.marquee} textClassName="h-[clamp(56px,12vw,180px)] fill-paper-foreground" />
      <div className="page-wrap mt-[clamp(28px,4vw,56px)]">
        <h2 id="work-heading" className="m-0 max-w-[18ch] type-wide text-[clamp(22px,3.4vw,48px)] leading-none">
          {work.heading}
        </h2>
        <p className="mt-4 mb-0 max-w-[52ch] text-[clamp(15px,1.3vw,18px)] leading-[1.45]">{work.intro}</p>
        {children}
      </div>
    </section>
  );
}
