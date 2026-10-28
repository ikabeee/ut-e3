export interface Passport {
  gamertag: string;
  pin: string;
}

export interface PassportStand {
  code: string;
  visited: boolean;
}

export interface PassportTicket {
  number: number;
  milestone: number;
}

export interface PassportVisits {
  visitCount: number;
  stands: PassportStand[];
  tickets: PassportTicket[];
}
