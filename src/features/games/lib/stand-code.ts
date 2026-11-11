export interface StandLocation {
  zone: string;
  number: number;
}

/** The full code the administrators see: zone, stand, studio and group, like `ZA-S1-E6-101` (RF-11). */
export function formatAdminStandCode(stand: AdminStandLocation): string {
  return `${formatStandCode(stand)}-E${stand.studio}-${stand.groupCode}`;
}

export function formatStandCode(location: StandLocation): string {
  return `Z${location.zone}-S${location.number}`;
}

export interface AdminStandLocation extends StandLocation {
  studio: number;
  groupCode: string;
}
