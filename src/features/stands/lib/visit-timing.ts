/** The hours of event_settings that decide whether a queued visit still counts (RN-04). */
export interface VisitWindow {
  eventStartsAt: Date;
  checkInCutoffAt: Date;
  raffleStartsAt: Date;
}

/**
 * The hour of the PIN as the server trusts it: never after the moment it arrived (a clock that runs ahead) and never
 * before the opening of the event (a clock that runs behind), as in the V1 (EC-01).
 */
export function clampScannedAt(scannedAt: Date, receivedAt: Date, eventStartsAt: Date): Date {
  const notAfterArrival = Math.min(scannedAt.getTime(), receivedAt.getTime());

  return new Date(Math.max(notAfterArrival, eventStartsAt.getTime()));
}

/** A visit counts if the PIN was taken before the cutoff and it reaches the server before the raffle (RN-04, EC-02). */
export function isLateVisit(scannedAt: Date, receivedAt: Date, window: VisitWindow): boolean {
  return scannedAt >= window.checkInCutoffAt || receivedAt >= window.raffleStartsAt;
}
