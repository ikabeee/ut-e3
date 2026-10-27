import { Card } from "@heroui/react";
import type { Passport } from "@features/visitors/lib/types";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

interface PassportCardProps {
  passport: Passport;
}

const COPY = VISITORS_COPY.passport;

export function PassportCard({ passport }: Readonly<PassportCardProps>) {
  return (
    <Card className="w-full max-w-sm rounded-none border border-border bg-surface p-6 shadow-none">
      <Card.Header className="flex flex-col items-center gap-1 p-0 text-center">
        <span className="type-tiny text-muted">{COPY.gamertagLabel}</span>
        <Card.Title className="type-section text-foreground">{passport.gamertag}</Card.Title>
      </Card.Header>

      <Card.Content className="my-6 flex flex-col items-center gap-2 p-0 text-center">
        <span className="type-tiny text-muted">{COPY.pinLabel}</span>
        <p className="type-mono text-4xl font-bold tracking-widest text-accent sm:text-5xl">{passport.pin}</p>
      </Card.Content>

      <Card.Footer className="flex flex-col items-center p-0 text-center">
        <p className="type-tiny text-muted">{COPY.description}</p>
      </Card.Footer>
    </Card>
  );
}
