import { Fragment, useRef } from "react";
import { SponsorContactLinks } from "@features/sponsors/components/sponsor-contact-links";
import type { Sponsor } from "@features/sponsors/lib/types";
import { useFitText } from "@shared/hooks/use-fit-text";

interface SponsorCaptionProps {
  sponsor: Sponsor;
}

export function SponsorCaption({ sponsor }: Readonly<SponsorCaptionProps>) {
  const nameRef = useRef<HTMLHeadingElement>(null);
  useFitText(nameRef, sponsor.name);

  return (
    <div className="flex flex-col gap-4 px-gutter pt-4 pb-[clamp(20px,3vw,40px)]">
      <h2
        ref={nameRef}
        key={sponsor.id}
        className="type-wide text-[clamp(32px,5vw,84px)] leading-[.92] tracking-tighter"
      >
        {sponsor.name.split(" ").map((word, index) => (
          <Fragment key={`${word}-${index}`}>
            {index > 0 ? " " : null}
            <span className="inline-block animate-rise whitespace-nowrap">{word}</span>
          </Fragment>
        ))}
      </h2>
      <p className="m-0 max-w-[42ch] text-[clamp(16px,1.3vw,19px)] leading-[1.35] text-copy">{sponsor.services}</p>
      <SponsorContactLinks sponsor={sponsor} />
    </div>
  );
}
