// Visits that earn a raffle ticket, in order (RF-22, RN-01). A visitor earns at most one ticket per milestone.
export const TICKET_MILESTONES = [9, 18] as const;

export interface TicketProgress {
  complete: boolean;
  visits: number;
  target: number | null;
  remaining: number;
  ratio: number;
}

// Measures from the previous milestone (or from zero before the first one), so the bar restarts after each ticket.
export function getTicketProgress(visits: number): TicketProgress {
  const target = TICKET_MILESTONES.find((milestone) => visits < milestone);

  if (target === undefined) {
    return { complete: true, visits, target: null, remaining: 0, ratio: 1 };
  }

  const previous = TICKET_MILESTONES.filter((milestone) => milestone <= visits).at(-1) ?? 0;

  return {
    complete: false,
    visits,
    target,
    remaining: target - visits,
    ratio: (visits - previous) / (target - previous),
  };
}
