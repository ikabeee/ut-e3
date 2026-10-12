import { RaffleTicketCard } from "@features/visitors/components/raffle-ticket-card";
import { RaffleTicketForm } from "@features/visitors/components/raffle-ticket-form";
import { countMissingGames, getRaffleStage } from "@features/visitors/lib/passport";
import type { VisitorPassport } from "@features/visitors/lib/types";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

interface PassportRaffleProps {
  passport: VisitorPassport;
}

/** Sorteo: bloqueado hasta probar todos los juegos, luego el formulario y al final el boleto. */
export function PassportRaffle({ passport }: Readonly<PassportRaffleProps>) {
  const stage = getRaffleStage(passport);
  const copy = VISITORS_COPY.raffle;

  if (stage === "ticket" && passport.ticket) {
    return <RaffleTicketCard ticket={passport.ticket} />;
  }
  if (stage === "claim") {
    return (
      <div className="flex flex-col gap-4">
        <p className="m-0 text-copy-strong">{copy.claimIntro}</p>
        <RaffleTicketForm />
      </div>
    );
  }
  return (
    <p className="m-0 text-copy-warm">
      {passport.requiredCount > 0 ? copy.locked(countMissingGames(passport)) : copy.noStands}
    </p>
  );
}
