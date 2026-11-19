import { PUBLIC_BRACKET_PATH } from "@features/tournament/lib/tournament-links";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";
import { PASSPORT_PATH, RECOVER_PATH } from "@features/visitors/lib/visitors-links";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { SITE_COPY } from "@features/site/lib/site-copy";

/** The public page that tells a visitor who to go to when something fails (S6). */
export const HELP_PATH = "/help";

export type HelpIllustrationId = "lost-phone" | "no-email" | "stand-visit" | "tickets" | "kof" | "offline";

export interface HelpTopicLink {
  href: string;
  label: string;
}

export interface HelpTopic {
  id: HelpIllustrationId;
  /** The drawing of the card; it has the id of the topic. */
  illustration: HelpIllustrationId;
  title: string;
  /** One line: what the visitor does. */
  solution: string;
  link?: HelpTopicLink;
}

const COPY = SITE_COPY.help;

const TOPIC_COPY = COPY.topics;

const OPEN_PASSPORT: HelpTopicLink = { href: PASSPORT_PATH, label: COPY.passportLink };

/**
 * The problems a visitor can have and what to do, from what the app already solves: the passport and its recovery, the
 * stand visits, the raffle tickets, the KOF registration and the use without a connection. Only the visitor's side:
 * no staff roles nor internal tools.
 */
export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "lost-phone",
    illustration: "lost-phone",
    title: TOPIC_COPY.lostPhone.title,
    solution: TOPIC_COPY.lostPhone.solution(COPY.desk),
    link: { href: RECOVER_PATH, label: TOPIC_COPY.lostPhone.link },
  },
  {
    id: "no-email",
    illustration: "no-email",
    title: TOPIC_COPY.noEmail.title,
    solution: TOPIC_COPY.noEmail.solution(COPY.desk),
    link: OPEN_PASSPORT,
  },
  {
    id: "stand-visit",
    illustration: "stand-visit",
    title: TOPIC_COPY.standVisit.title,
    solution: TOPIC_COPY.standVisit.solution,
  },
  {
    id: "tickets",
    illustration: "tickets",
    title: TOPIC_COPY.tickets.title,
    solution: TOPIC_COPY.tickets.solution(VISITORS_COPY.passport.tickets.title, COPY.desk),
    link: OPEN_PASSPORT,
  },
  {
    id: "kof",
    illustration: "kof",
    title: TOPIC_COPY.kof.title,
    solution: TOPIC_COPY.kof.solution(TOURNAMENT_COPY.ui.entries.selfEntry.submit),
    link: { href: PUBLIC_BRACKET_PATH, label: TOPIC_COPY.kof.link },
  },
  {
    id: "offline",
    illustration: "offline",
    title: TOPIC_COPY.offline.title,
    solution: TOPIC_COPY.offline.solution,
    link: OPEN_PASSPORT,
  },
];
