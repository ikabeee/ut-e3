import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import type { MyRoleCard as MyRoleCardData } from "@features/accounts/lib/my-role";
import { ActionLink } from "@shared/components/action-link";

const SECTIONS = ACCOUNTS_COPY.myRole.sections;

/** One role of the account: what it does in the event, where, with which screens and who to ask (S4). */
export function MyRoleCard({ card }: Readonly<{ card: MyRoleCardData }>) {
  const headingId = `my-role-${card.role}`;

  return (
    <article aria-labelledby={headingId} className="grid gap-6 border border-border p-5 min-[561px]:p-8">
      <header className="grid gap-2">
        <h2 id={headingId} className="type-section">
          {card.title}
        </h2>
        <p className="text-muted">{card.summary}</p>
      </header>
      <Steps steps={card.steps} />
      {card.placement ? <TextSection heading={SECTIONS.placement} text={card.placement} /> : null}
      <Screens screens={card.screens} />
      <TextSection heading={SECTIONS.contact} text={card.contact} />
    </article>
  );
}

function Steps({ steps }: Readonly<Pick<MyRoleCardData, "steps">>) {
  return (
    <section className="grid gap-3">
      <h3 className="type-mono text-accent">{SECTIONS.steps}</h3>
      <ol aria-label={SECTIONS.steps} className="m-0 grid list-decimal gap-2 pl-6">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );
}

function TextSection({ heading, text }: Readonly<{ heading: string; text: string }>) {
  return (
    <section className="grid gap-2">
      <h3 className="type-mono text-accent">{heading}</h3>
      <p>{text}</p>
    </section>
  );
}

function Screens({ screens }: Readonly<Pick<MyRoleCardData, "screens">>) {
  return (
    <nav aria-label={SECTIONS.screens} className="grid gap-3">
      <h3 className="type-mono text-accent">{SECTIONS.screens}</h3>
      <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
        {screens.map((screen) => (
          <li key={screen.href}>
            <ActionLink href={screen.href} variant="outline" className="min-h-11">
              {screen.label}
            </ActionLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
