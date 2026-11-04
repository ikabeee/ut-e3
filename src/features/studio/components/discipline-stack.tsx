import { DisciplineCard } from "@features/studio/components/discipline-card";
import { STUDIO_COPY } from "@features/studio/lib/studio-copy";
import { STUDIO_DISCIPLINES_SECTION_ID } from "@features/studio/lib/studio-links";
import type { Discipline } from "@features/studio/lib/types";

/** "Qué hacemos": cards that stack on top of each other while scrolling. */
export function DisciplineStack({ disciplines }: Readonly<{ disciplines: Discipline[] }>) {
  return (
    <section id={STUDIO_DISCIPLINES_SECTION_ID} aria-labelledby="disciplines-heading" className="section-block">
      <div className="page-wrap">
        <h2 id="disciplines-heading" className="mb-[clamp(32px,5vw,72px)] type-giant">
          {STUDIO_COPY.disciplines.heading}
        </h2>
        <div className="flex flex-col gap-[clamp(64px,14svh,160px)] pb-[clamp(40px,10svh,120px)]">
          {disciplines.map((discipline, index) => (
            <DisciplineCard key={discipline.id} discipline={discipline} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
