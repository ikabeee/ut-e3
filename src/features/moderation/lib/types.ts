export interface FraudThresholds {
  topScoreCount: number;
  windowMinutes: number;
  singleVisitMax: number;
}

/** A vote whose three ratings are 5, of a check-in that counts. */
export interface TopScoreVote {
  standId: string;
  createdAt: string;
}

export interface StandBurst {
  standId: string;
  count: number;
  startsAt: string;
  endsAt: string;
}

export interface VisitorVisitCount {
  visitorId: string;
  visitCount: number;
}

export interface FraudAlerts {
  thresholds: FraudThresholds;
  bursts: (StandBurst & { standCode: string; visits: BurstVisit[] })[];
  fewStandVisitors: { visitorId: string; gamertag: string; visitCount: number; standCodes: string[] }[];
  /** How many visitors match in total; the list shows only the most recent ones. */
  fewStandVisitorTotal: number;
}

export interface ModerationCheckIn {
  id: string;
  standCode: string;
  checkedInAt: string;
  annulment: { at: string; reason: string; byName: string } | null;
}

export interface ModerationTicket {
  number: number;
  milestone: number;
  status: string;
}

export interface ModerationVisitor {
  id: string;
  gamertag: string;
  fullName: string;
  validVisitCount: number;
  exclusion: { at: string; reason: string } | null;
  checkIns: ModerationCheckIn[];
  tickets: ModerationTicket[];
}

export interface VoteRatings {
  game: number;
  stand: number;
  art: number;
}

/** A visit inside the lapse of a burst: who was it, when and what it rated. There is never a PIN here. */
export interface BurstVisit {
  checkInId: string;
  visitorId: string;
  gamertag: string;
  maskedEmail: string;
  at: string;
  ratings: VoteRatings;
}

export type StandVisitStatus = "valid" | "annulled" | "excluded";

/** A row of the "Por stand" view and of its CSV. */
export interface StandVisit {
  checkInId: string;
  visitorId: string;
  gamertag: string;
  at: string;
  /** The staff account that had the kiosk open, if it was recorded. */
  recordedBy: string | null;
  ratings: VoteRatings | null;
  status: StandVisitStatus;
}

export interface ModerationStand {
  id: string;
  code: string;
}
