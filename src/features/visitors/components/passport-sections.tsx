import type { ReactNode } from "react";
import { PassportCard } from "@features/visitors/components/passport-card";
import { PassportProgress } from "@features/visitors/components/passport-progress";
import { PassportStands } from "@features/visitors/components/passport-stands";
import { PassportTickets } from "@features/visitors/components/passport-tickets";
import { getTicketProgress } from "@features/visitors/lib/passport-progress";
import type { Passport, PassportVisits } from "@features/visitors/lib/types";

interface PassportSectionsProps {
  passport: Passport;
  visits: PassportVisits;
  /** What the page composes under the card, such as the tournament notice. */
  extra?: ReactNode;
}

/** The passport as the visitor reads it; the online page and the offline copy use the same sections. */
export function PassportSections({ passport, visits, extra }: Readonly<PassportSectionsProps>) {
  return (
    <>
      <PassportCard passport={passport} />
      {extra}

      <PassportProgress progress={getTicketProgress(visits.visitCount)} />

      <PassportStands stands={visits.stands} />

      <PassportTickets tickets={visits.tickets} />
    </>
  );
}
