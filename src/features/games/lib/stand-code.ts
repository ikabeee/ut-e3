export interface StandLocation {
  zone: string;
  number: number;
}

export function formatStandCode(location: StandLocation): string {
  return `Z${location.zone}-S${location.number}`;
}
