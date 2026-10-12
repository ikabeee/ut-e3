import { PassportGameList } from "@features/visitors/components/passport-game-list";
import { PassportProgress } from "@features/visitors/components/passport-progress";
import { PassportRaffle } from "@features/visitors/components/passport-raffle";
import { PassportSection } from "@features/visitors/components/passport-section";
import { VisitorQrCard } from "@features/visitors/components/visitor-qr-card";
import type { VisitorPassport } from "@features/visitors/lib/types";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

interface VisitorPassportViewProps {
  passport: VisitorPassport;
}

/** Pasaporte del visitante: QR a un lado; avance, sorteo y juegos al otro. */
export function VisitorPassportView({ passport }: Readonly<VisitorPassportViewProps>) {
  return (
    <div className="grid grid-cols-[minmax(260px,360px)_minmax(0,1fr)] items-start gap-[clamp(24px,4vw,56px)] max-[860px]:grid-cols-1">
      <div className="sticky top-[calc(env(safe-area-inset-top,0px)+76px)] max-[860px]:static">
        <VisitorQrCard gamertag={passport.gamertag} qrUrl={passport.qrUrl} />
      </div>
      <div className="flex min-w-0 flex-col gap-8">
        <PassportProgress checkedCount={passport.checkedCount} requiredCount={passport.requiredCount} />
        <PassportSection title={VISITORS_COPY.raffle.heading}>
          <PassportRaffle passport={passport} />
        </PassportSection>
        <PassportSection title={VISITORS_COPY.games.heading}>
          <PassportGameList games={passport.games} />
        </PassportSection>
      </div>
    </div>
  );
}
