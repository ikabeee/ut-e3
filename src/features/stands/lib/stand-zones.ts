/** Blocks A to D and T, the horror zone (SRS section 1.1). */
export const STAND_ZONES = ["A", "B", "C", "D", "T"] as const;

export type StandZone = (typeof STAND_ZONES)[number];

const HORROR_ZONE: StandZone = "T";

/** Blocks A to D have 3 stands each and the horror zone has 6, which adds up to the 18 of the event (RN-01). */
export function getZoneCapacity(zone: StandZone): number {
  return zone === HORROR_ZONE ? 6 : 3;
}

export function toStandZone(value: string): StandZone | null {
  return STAND_ZONES.find((zone) => zone === value) ?? null;
}
