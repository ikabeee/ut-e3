import Image from "next/image";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { GUESTS_SECTION_ID } from "@features/landing/lib/landing-links";
import type { SpecialGuest } from "@features/landing/lib/types";
import { cn } from "@heroui/react";
import { PaperCard } from "@shared/components/paper-card";

interface SpecialGuestsProps {
  guests: readonly SpecialGuest[];
}

export function SpecialGuests({ guests }: Readonly<SpecialGuestsProps>) {
  return (
    <section id={GUESTS_SECTION_ID} className="section-block">
      <div className="page-wrap">
        <h2 className="type-giant">{LANDING_COPY.guests.heading}</h2>
        <ul
          className={cn(
            "m-0 mt-[clamp(36px,5vw,64px)] grid list-none gap-gutter p-0",
            guests.length === 1 ? "mx-auto max-w-140 grid-cols-1" : "grid-cols-2 max-[820px]:grid-cols-1",
          )}
        >
          {guests.map((guest) => (
            <li key={guest.id} className="flex min-w-0 flex-col">
              <GuestCard guest={guest} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function GuestCard({ guest }: Readonly<{ guest: SpecialGuest }>) {
  return (
    <PaperCard className="flex-1 gap-3 px-[22px] pt-[22px] pb-7">
      <GuestPhoto photo={guest.photo} />
      {guest.role ? <span className="type-tiny">{guest.role}</span> : null}
      <h3 className="type-wide text-[clamp(24px,2.6vw,34px)] leading-[.95] tracking-[-.03em]">{guest.name}</h3>
      <p className="m-0 max-w-[40ch] text-lg leading-[1.2]">{guest.talk}</p>
    </PaperCard>
  );
}

function GuestPhoto({ photo }: Readonly<{ photo: SpecialGuest["photo"] }>) {
  if (!photo) return <div aria-hidden="true" className="aspect-4/3 w-full bg-paper-rule" />;

  return (
    <div className="relative aspect-4/3 w-full overflow-hidden bg-paper-rule">
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes="(min-width: 821px) 560px, 100vw"
        className="object-cover object-top"
      />
    </div>
  );
}
