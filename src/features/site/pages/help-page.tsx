import type { Metadata } from "next";
import { HelpTopicCard } from "@features/site/components/help-topic-card";
import { HELP_PATH, HELP_TOPICS } from "@features/site/lib/help-topics";
import { SITE_COPY } from "@features/site/lib/site-copy";
import { buildOpenGraph } from "@shared/lib/metadata";
import { siteConfig } from "@shared/lib/site-config";

const COPY = SITE_COPY.help;

export const helpPageMetadata: Metadata = {
  title: COPY.title,
  description: COPY.description,
  alternates: { canonical: HELP_PATH },
  openGraph: buildOpenGraph({
    title: `${COPY.title} | ${siteConfig.title}`,
    description: COPY.description,
    url: HELP_PATH,
  }),
};

/**
 * Who to go to when something fails (S6), for the visitor only. It reads no clock, session nor cookie, so Next
 * prerenders it and the service worker can keep it for use without a connection.
 */
export function HelpPage() {
  return (
    <main className="page-wrap flex flex-col gap-[clamp(32px,5vw,56px)] py-[clamp(48px,8vw,96px)]">
      <header className="flex flex-col items-start gap-4">
        <p className="type-tiny text-accent">{COPY.kicker}</p>
        <h1 className="type-giant wrap-break-word">{COPY.title}</h1>
        <p className="max-w-[46ch] text-copy">{COPY.lead}</p>
      </header>

      <ul aria-label={COPY.topicsLabel} className="m-0 grid list-none gap-4 p-0 min-[600px]:grid-cols-2 lg:grid-cols-3">
        {HELP_TOPICS.map((topic) => (
          <li key={topic.id}>
            <HelpTopicCard topic={topic} />
          </li>
        ))}
      </ul>
    </main>
  );
}
