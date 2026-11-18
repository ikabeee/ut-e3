import type { EventFlyer } from "@features/landing/lib/types";

/** The two flyers of the event, as SVG files of public/media/flyers (1080 x 1350, 4:5). */
export const EVENT_FLYERS: readonly EventFlyer[] = [
  { id: "fair", src: "/media/flyers/fair-flyer.svg", width: 1080, height: 1350 },
  { id: "tournament", src: "/media/flyers/tournament-flyer.svg", width: 1080, height: 1350 },
];
