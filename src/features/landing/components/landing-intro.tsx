import Image from "next/image";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";

interface LandingIntroProps {
  division: string;
}

/** Título, texto de apoyo, lema y banner de la portada. */
export function LandingIntro({ division }: Readonly<LandingIntroProps>) {
  const { title, lead, tagline, bannerAlt } = LANDING_COPY.intro;

  return (
    <div className="page-wrap flex flex-col gap-6 py-12 md:py-20">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <h2 className="max-w-xl text-3xl leading-tight font-bold uppercase md:text-[3.75rem]">{title}</h2>
        <p className="max-w-[517px] text-lg text-foreground/64 capitalize">{lead(division)}</p>
      </div>
      <hr className="border-foreground" />
      <ul className="flex flex-col gap-2 text-foreground/64 uppercase md:flex-row md:justify-between">
        {tagline.map((item, index) => (
          <li key={item} className="flex items-center gap-4 text-xl">
            {index > 0 ? (
              <span aria-hidden="true" className="hidden md:inline">
                →
              </span>
            ) : null}
            {item}
          </li>
        ))}
      </ul>
      <Image
        src="/landing/intro/intro-banner.webp"
        alt={bannerAlt}
        width={1661}
        height={947}
        sizes="(min-width: 1536px) 1348px, 100vw"
        className="h-auto w-full rounded-[25px]"
      />
    </div>
  );
}
