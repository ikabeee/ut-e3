import { RATING_VALUES, type RatingField } from "@features/stands/lib/survey-input";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";

interface KioskRatingFieldProps {
  name: RatingField;
  legend: string;
}

const COPY = STANDS_COPY.kiosk.survey;

/** One question of the survey: five numbers that work as a radio group, large enough to press on a kiosk screen. */
export function KioskRatingField({ name, legend }: Readonly<KioskRatingFieldProps>) {
  return (
    <fieldset className="m-0 grid min-w-0 gap-2 border-0 p-0">
      <legend className="mb-2 type-mono font-bold">{legend}</legend>
      <div className="grid grid-cols-5 gap-2">
        {RATING_VALUES.map((value) => (
          <label key={value} className="relative block">
            <input type="radio" name={name} value={value} required className="peer sr-only" />
            <span className="flex min-h-14 cursor-pointer items-center justify-center border border-border font-mono text-xl font-bold peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
              {value}
            </span>
          </label>
        ))}
      </div>
      <p className="m-0 flex justify-between type-tiny text-muted">
        <span>{COPY.scale.low}</span>
        <span>{COPY.scale.high}</span>
      </p>
    </fieldset>
  );
}
