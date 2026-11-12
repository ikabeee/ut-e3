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
  { id: "guest-2", name: "Por anunciar", talk: "Plática por anunciar" },
];

/**
 * The speaker of Noxy Digital. HIDDEN: it is not in SPECIAL_GUESTS, so no page shows it.
 *
 * PENDING (noxy-speaker), fill in: the sponsor has not sent the name, the role or the title of the talk ("FALTA NOMBRE" in their
 * file). Fill `name`, `role` and `talk` and replace the "Por anunciar" guest of SPECIAL_GUESTS with this one (or add
 * it to the list); the photo is already in public/speakers. Update the alt of the photo with the name too.
 */
export const PENDING_NOXY_SPEAKER: SpecialGuest = {
  id: "guest-noxy",
  name: "",
  talk: "",
  photo: { src: "/speakers/ponente-noxy.webp", alt: "" },
};
