import Image from "next/image";
import { EVENT_FLYERS } from "@features/landing/lib/event-flyers";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { FLYERS_SECTION_ID } from "@features/landing/lib/landing-links";

const { flyers } = LANDING_COPY;

/** The flyers of the fair and the tournament, side by side from 640px. They load lazily: they are far from the top. */
export function EventFlyers() {
  return (
    <section id={FLYERS_SECTION_ID} aria-labelledby="flyers-heading" className="section-block">
      <div className="page-wrap">
        <h2 id="flyers-heading" className="type-giant">
          {flyers.heading}
        </h2>
        <ul className="m-0 mt-[clamp(28px,4vw,56px)] grid list-none grid-cols-1 justify-items-center gap-gutter p-0 min-[640px]:grid-cols-2">
          {EVENT_FLYERS.map((flyer) => (
            <li key={flyer.id} className="w-full max-w-130">
              <Image
                src={flyer.src}
                alt={flyers.alt[flyer.id]}
                width={flyer.width}
                height={flyer.height}
                sizes="(min-width: 640px) 520px, 100vw"
                loading="lazy"
                className="block h-auto w-full border border-border"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
