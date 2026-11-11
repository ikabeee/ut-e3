/** The looping video of the hero; the sources go from the lightest to the most compatible. */
export const HERO_LOOP = {
  poster: "/media/hero-loop-poster.jpg",
  sources: [
    { src: "/media/hero-loop.webm", type: "video/webm" },
    { src: "/media/hero-loop.mp4", type: "video/mp4" },
  ],
} as const;
