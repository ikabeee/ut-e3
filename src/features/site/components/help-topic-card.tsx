import { HelpIllustration } from "@features/site/components/help-illustration";
import type { HelpTopic } from "@features/site/lib/help-topics";
import { ActionLink } from "@shared/components/action-link";

interface HelpTopicCardProps {
  topic: HelpTopic;
}

/** One problem: its drawing, a short title, one line of solution and, when there is one, the page that helps. */
export function HelpTopicCard({ topic }: Readonly<HelpTopicCardProps>) {
  const titleId = `help-${topic.id}`;

  return (
    <article aria-labelledby={titleId} className="flex h-full flex-col gap-4 border border-border bg-surface p-4">
      <div className="grid h-32 place-items-center border border-border bg-background">
        <HelpIllustration id={topic.illustration} />
      </div>
      <h2 id={titleId} className="type-wide text-lg text-foreground">
        {topic.title}
      </h2>
      <p className="text-copy">{topic.solution}</p>
      {topic.link ? (
        <ActionLink href={topic.link.href} arrow="e" className="mt-auto self-start pointer-coarse:min-h-11">
          {topic.link.label}
        </ActionLink>
      ) : null}
    </article>
  );
}
