import Image from "next/image";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import type { SpecialGuest } from "@features/landing/lib/types";
import { cn } from "@heroui/react";
import { PaperCard } from "@shared/components/paper-card";

interface GuestBadgeProps {
  guest: SpecialGuest;
  className?: string;
}

/** The event badge: the slot for the strap, the photo, the name and the talk. */
export function GuestBadge({ guest, className }: Readonly<GuestBadgeProps>) {
  return (
    <PaperCard
      className={cn(
        "relative w-full gap-3 px-5 pt-9 pb-6 shadow-cover min-[820px]:gap-4 min-[820px]:px-7 min-[820px]:pt-11 min-[820px]:pb-8",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute top-4 left-1/2 h-2.5 w-18 -translate-x-1/2 rounded-full bg-paper-foreground"
      />
      <GuestPhoto photo={guest.photo} />
      {guest.role ? <span className="type-tiny">{guest.role}</span> : null}
      <h3 className="type-wide text-[19px] leading-[.95] tracking-[-.03em] min-[820px]:text-[26px]">{guest.name}</h3>
      <p className="m-0 text-[17px] leading-[1.2]">{guest.talk}</p>
    </PaperCard>
  );
}

function GuestPhoto({ photo }: Readonly<{ photo: SpecialGuest["photo"] }>) {
  if (!photo) {
    return (
      <div aria-hidden="true" className="grid aspect-4/5 w-full place-items-center bg-paper-rule">
        <span className="type-mono">{LANDING_COPY.guests.photoPending}</span>
      </div>
    );
  }

  return (
    <div className="relative aspect-4/5 w-full overflow-hidden bg-paper-rule">
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes="(min-width: 820px) 440px, 320px"
        className="object-cover object-top"
      />
    </div>
  );
}
