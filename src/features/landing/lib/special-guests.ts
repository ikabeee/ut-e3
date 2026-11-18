import type { SpecialGuest } from "@features/landing/lib/types";

export const SPECIAL_GUESTS: readonly SpecialGuest[] = [
  {
    id: "guest-1",
    name: "Ing. Ariana Patricia Tzuc Vázquez",
    talk: "Plática por anunciar",
    photo: {
      src: "/speakers/ponente-1.webp",
      alt: "Retrato de Ing. Ariana Patricia Tzuc Vázquez",
    },
  },
  {
    id: "guest-noxy",
    name: "Ing. Noelí Rodríguez Morales",
    talk: "Plática por anunciar",
    photo: {
      src: "/speakers/ponente-noxy.webp",
      alt: "Retrato de Ing. Noelí Rodríguez Morales",
    },
  },
];

/**
 * The `sizes` of a badge photo: the badge is 320px wide on a phone and 440px from 820px, minus the padding of the card
 * (40px and 56px). Next only asks the optimizer for the widths that this slot can use, not for the full file.
 */
export const GUEST_PHOTO_SIZES = "(min-width: 820px) 384px, 280px";

/** The guests the visitor can reach with one move (next or previous), without the current one, that have a photo. */
export function getNeighborGuests(guests: readonly SpecialGuest[], index: number): SpecialGuest[] {
  const neighborIndexes = new Set([(index + 1) % guests.length, (index - 1 + guests.length) % guests.length]);

  neighborIndexes.delete(index);

  return [...neighborIndexes].flatMap((neighborIndex) => {
    const guest = guests[neighborIndex];

    return guest?.photo ? [guest] : [];
  });
}
