import type { CSSProperties } from "react";
import { Chip, cn } from "@heroui/react";
import { PixelMark } from "@features/studio/components/pixel-mark";
import { PixelStairs } from "@features/studio/components/pixel-stairs";
import { VISIBLE_TAGS } from "@features/studio/lib/studio-content";
import { STUDIO_COPY } from "@features/studio/lib/studio-copy";
import type { Discipline, DisciplineTone } from "@features/studio/lib/types";
import { ActionLink } from "@shared/components/action-link";

interface DisciplineCardProps {
  discipline: Discipline;
  /** Place in the stack: decides where the card sticks and its tilt. */
  index: number;
}

const TONE_CLASSES: Record<DisciplineTone, string> = {
  paper: "bg-paper text-paper-foreground",
  accent: "bg-accent text-black",
  panel: "border border-border bg-surface text-foreground",
  deep: "bg-accent-deep text-foreground",
};

const TAG_CLASSES: Record<DisciplineTone, string> = {
  paper: "bg-black text-paper",
  accent: "bg-black text-accent",
  panel: "bg-accent text-black",
  deep: "bg-foreground text-black",
};

const CTA_VARIANT: Record<DisciplineTone, "primary" | "tertiary"> = {
  paper: "tertiary",
  accent: "tertiary",
  panel: "primary",
  deep: "tertiary",
};

// Vertical gap between stuck cards, so the edge of the previous ones shows.
const STACK_OFFSET = 26;

const TILTS = [-1.2, 1.4, -0.8, 1.1];

/** A discipline: it sticks while scrolling and the next one covers it. */
export function DisciplineCard({ discipline, index }: Readonly<DisciplineCardProps>) {
  const titleId = `discipline-${discipline.id}`;

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        "sticky isolate min-h-[clamp(360px,62svh,560px)] overflow-hidden shadow-[0_-18px_40px_rgba(0,0,0,.45)]",
        TONE_CLASSES[discipline.tone],
      )}
      style={stackStyle(index)}
    >
      <PixelStairs className="-z-1 opacity-[.07]" />
      <div className="grid gap-8 p-[clamp(24px,4.5vw,64px)] md:grid-cols-2 md:gap-12">
        <div>
          <p className="m-0 flex items-center gap-3 type-mono">
            <PixelMark />
            {discipline.eyebrow}
          </p>
          <h3 id={titleId} className="mt-3 mb-0 type-giant">
            {discipline.title}
          </h3>
        </div>
        <DisciplineDetails discipline={discipline} />
      </div>
    </article>
  );
}

function stackStyle(index: number): CSSProperties {
  return {
    top: `calc(var(--nav-height) + 20px + ${index * STACK_OFFSET}px)`,
    rotate: `${TILTS[index % TILTS.length]}deg`,
  };
}

function DisciplineDetails({ discipline }: Readonly<{ discipline: Discipline }>) {
  return (
    <div className="flex flex-col items-start gap-6">
      <SkillTags tags={discipline.tags} tone={discipline.tone} />
      <p className="m-0 max-w-[44ch] text-[clamp(16px,1.5vw,21px)] leading-[1.4] font-medium">
        {discipline.description}
      </p>
      <ActionLink href={discipline.cta.href} variant={CTA_VARIANT[discipline.tone]} arrow="e" className="min-h-11">
        {discipline.cta.label}
      </ActionLink>
    </div>
  );
}

function SkillTags({ tags, tone }: Readonly<{ tags: string[]; tone: DisciplineTone }>) {
  const hiddenTags = tags.slice(VISIBLE_TAGS);

  return (
    <ul aria-label={STUDIO_COPY.disciplines.skillsLabel} className="m-0 flex list-none flex-wrap gap-2 p-0">
      {tags.slice(0, VISIBLE_TAGS).map((tag) => (
        <li key={tag}>
          <Chip className={cn("rounded-none px-3 py-1.5 type-tiny", TAG_CLASSES[tone])}>{tag}</Chip>
        </li>
      ))}
      {hiddenTags.length > 0 ? (
        <li>
          <Chip
            aria-label={STUDIO_COPY.disciplines.moreSkills(hiddenTags.length, hiddenTags.join(", "))}
            className="rounded-none border border-current bg-transparent px-3 py-1.5 type-tiny text-current"
          >
            +{hiddenTags.length}
          </Chip>
        </li>
      ) : null}
    </ul>
  );
}
