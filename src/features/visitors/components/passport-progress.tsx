import { Label, ProgressBar } from "@heroui/react";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

interface PassportProgressProps {
  checkedCount: number;
  requiredCount: number;
}

/** Avance del visitante: juegos probados de los que cuentan para el boleto. */
export function PassportProgress({ checkedCount, requiredCount }: Readonly<PassportProgressProps>) {
  const copy = VISITORS_COPY.progress;

  return (
    <ProgressBar
      value={checkedCount}
      maxValue={Math.max(requiredCount, 1)}
      valueLabel={copy.value(checkedCount, requiredCount)}
      className="flex w-full flex-col gap-2"
    >
      <div className="flex items-baseline justify-between gap-4">
        <Label className="type-tiny text-muted">{copy.label}</Label>
        <ProgressBar.Output className="font-mono text-[15px] text-foreground" />
      </div>
      <ProgressBar.Track className="h-2 rounded-none bg-surface">
        <ProgressBar.Fill className="rounded-none bg-accent" />
      </ProgressBar.Track>
    </ProgressBar>
  );
}
