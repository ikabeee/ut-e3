import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

interface PassportHeaderProps {
  eventDateLabel: string;
}

/** Título e instrucciones del pasaporte. */
export function PassportHeader({ eventDateLabel }: Readonly<PassportHeaderProps>) {
  const copy = VISITORS_COPY.header;

  return (
    <header className="flex flex-col gap-3">
      <span className="type-tiny text-muted">{copy.kicker(eventDateLabel)}</span>
      <h1 className="font-wide text-[clamp(28px,4.4vw,60px)] leading-[.95] font-bold tracking-[-.035em] uppercase">
        {copy.title}
      </h1>
      <p className="m-0 max-w-[62ch] text-[clamp(16px,1.4vw,19px)] leading-[1.4] text-copy-strong">{copy.intro}</p>
    </header>
  );
}
