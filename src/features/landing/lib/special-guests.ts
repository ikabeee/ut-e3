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
