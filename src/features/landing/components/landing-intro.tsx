import Image from "next/image";
import { LANDING_COPY } from "@features/landing/lib/landing-copy";

interface LandingIntroProps {
  division: string;
}

/**
 * Título, texto de apoyo, lema y banner de la portada. Medidas del Figma a 1512 px: margen de 81 px, título de
 * 46 px en dos líneas, texto de apoyo de 517 px, lema de 25 px con flechas a 46 px de cada frase y banner de 1348 x 583.
 */
export function LandingIntro({ division }: Readonly<LandingIntroProps>) {
  const { title, lead, tagline, bannerAlt } = LANDING_COPY.intro;

  return (
    <div className="mx-auto flex max-w-[1512px] flex-col gap-6 px-[clamp(1rem,5.36vw,5.06rem)] py-12 md:gap-0 md:pt-[clamp(2rem,8.53vw,8.06rem)] md:pb-[120px]">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <h2 className="text-3xl leading-tight font-bold uppercase md:w-[38.4vw] md:text-[clamp(1.75rem,3.05vw,2.9rem)] md:leading-[1.3]">
          {title}
        </h2>
        <p className="text-lg text-muted capitalize md:mt-6 md:-mr-[2.5vw] md:w-[34.2vw] md:text-[clamp(1rem,1.32vw,1.25rem)] md:leading-[1.4]">
          {lead(division)}
        </p>
      </div>
      <hr className="border-separator md:mt-10" />
      <ul className="flex flex-col gap-2 text-xl text-muted uppercase md:mt-[51px] md:flex-row md:items-center md:gap-[1.8em] md:text-[clamp(0.9rem,1.67vw,1.58rem)] md:leading-[29px] md:font-light">
        {tagline.map((item, index) => (
          <li key={item} className="contents">
            {index > 0 ? (
              <span aria-hidden="true" className="hidden md:inline">
                →
              </span>
            ) : null}
            <span className="md:whitespace-nowrap">{item}</span>
          </li>
        ))}
      </ul>
      <Image
        src="/landing/intro/intro-banner.webp"
        alt={bannerAlt}
        width={1661}
        height={947}
        sizes="(min-width: 1536px) 1348px, 100vw"
        className="aspect-[1348/583] h-auto w-full rounded-[25px] object-cover md:mt-[41px]"
      />
    </div>
  );
}
