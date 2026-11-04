import type { CSSProperties } from "react";
import { PixelMark } from "@features/studio/components/pixel-mark";
import { PixelStairs } from "@features/studio/components/pixel-stairs";
import { STUDIO_COPY } from "@features/studio/lib/studio-copy";
import type { Testimonial } from "@features/studio/lib/types";

const { testimonials: COPY } = STUDIO_COPY;

/** "Lo que dicen": quotes on tilted cards over a panel of pixel steps. */
export function TestimonialBoard({ testimonials }: Readonly<{ testimonials: Testimonial[] }>) {
  return (
    <section aria-labelledby="testimonials-heading" className="section-block">
      <div className="page-wrap">
        <div className="relative isolate overflow-hidden border border-border bg-surface px-[clamp(20px,4vw,64px)] py-[clamp(40px,6vw,96px)]">
          <PixelStairs className="-z-1 text-accent opacity-[.08]" />
          <div className="mb-[clamp(32px,5vw,64px)] flex flex-wrap items-end justify-between gap-4">
            <h2 id="testimonials-heading" className="m-0 type-giant">
              {COPY.heading}
            </h2>
            <p className="m-0 flex items-center gap-2 bg-accent px-3 py-2 type-tiny text-black">
              <PixelMark />
              {COPY.badge}
            </p>
          </div>
          <ul className="m-0 grid list-none gap-[clamp(20px,3vw,40px)] p-0 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <QuoteCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function QuoteCard({ testimonial }: Readonly<{ testimonial: Testimonial }>) {
  return (
    <li className="scroll-settle" style={settleStyle(testimonial.tilt)}>
      <figure
        className="m-0 flex h-full flex-col justify-between gap-8 bg-paper p-[clamp(20px,2.4vw,32px)] text-paper-foreground shadow-[10px_10px_0_0_var(--utg-blue-5)]"
        style={{ rotate: `${testimonial.tilt}deg` }}
      >
        <blockquote className="m-0 type-wide text-[clamp(16px,1.5vw,21px)] leading-[1.2] tracking-[-.02em]">
          {testimonial.quote}
        </blockquote>
        <figcaption className="flex items-center gap-2 type-tiny">
          <PixelMark className="text-accent-deep" />
          {testimonial.author}
        </figcaption>
      </figure>
    </li>
  );
}

function settleStyle(tilt: number): CSSProperties {
  // SAFETY: React types know no custom properties; `--settle-tilt` is read by the `scroll-settle` keyframes.
  return { "--settle-tilt": `${tilt * 2}deg` } as CSSProperties;
}
