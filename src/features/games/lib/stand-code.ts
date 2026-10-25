export interface StandLocation {
  zone: string;
  number: number;
}

export function formatStandCode(location: StandLocation): string {
  return `z${location.zone}-s${location.number}`;
}
