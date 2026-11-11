import type { ReactNode } from "react";

interface ActivityTileProps {
  title: string;
  line: string;
  children: ReactNode;
}

export function ActivityTile({ title, line, children }: Readonly<ActivityTileProps>) {
  return (
    <article className="flex min-w-0 flex-col gap-4 border border-border bg-surface p-5">
      <div className="flex h-40 items-center justify-center *:size-full">{children}</div>
      <h4 className="m-0 type-wide text-lg leading-none tracking-[-0.03em]">{title}</h4>
      <p className="m-0 type-mono text-copy">{line}</p>
    </article>
  );
}
