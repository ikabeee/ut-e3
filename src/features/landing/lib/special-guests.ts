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
