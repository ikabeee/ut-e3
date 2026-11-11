import type { ReactNode } from "react";
import type { MotionState } from "@features/landing/hooks/use-act-motion";

interface ActFrameProps {
  id: string;
  word: string;
  motion: MotionState;
  description?: ReactNode;
  children: ReactNode;
}

export function ActFrame({ id, word, motion, description, children }: Readonly<ActFrameProps>) {
  return (
    <article
      data-act={id}
      data-motion={motion}
      className="grid items-center gap-6 border-t border-border py-[clamp(32px,5vw,72px)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16"
    >
      <div className="flex min-w-0 flex-col items-start gap-5">
        <h3 className="m-0 bg-accent px-4 py-2 text-[clamp(32px,6vw,88px)] leading-none tracking-[-0.04em] text-background uppercase">
          {word}
        </h3>
        {description}
      </div>
      <div className="min-w-0">{children}</div>
    </article>
  );
}
