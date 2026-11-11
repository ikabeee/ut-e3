import type { SpecialGuest } from "@features/landing/lib/types";

export const SPECIAL_GUESTS: readonly SpecialGuest[] = [
  {
    id: "guest-1",
    name: "Por anunciar",
    talk: "Plática por anunciar",
    photo: {
      src: "/speakers/ponente-1.webp",
      alt: "Retrato de la persona invitada, con lentes, frente a un muro oscuro y plantas",
    },
  },
  // To bring the second card back, restore: { id: "guest-2", name: "Por anunciar", talk: "Plática por anunciar" },
];
