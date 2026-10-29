import { ProgressBar } from "@heroui/react";
import type { TicketProgress } from "@features/visitors/lib/passport-progress";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

interface PassportProgressProps {
  progress: TicketProgress;
}

const COPY = VISITORS_COPY.passport.progress;

export function PassportProgress({ progress }: Readonly<PassportProgressProps>) {
  const percent = Math.round(progress.ratio * 100);

  return (
    <section className="flex w-full max-w-sm flex-col gap-2">
      <ProgressBar aria-label={COPY.label} value={percent} className="w-full">
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>

      <p className="type-tiny text-muted">{progress.complete ? COPY.complete : COPY.remaining(progress.remaining)}</p>
    </section>
  );
}
