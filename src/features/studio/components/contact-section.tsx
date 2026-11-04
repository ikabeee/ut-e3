import { LedWordmark } from "@features/landing/components/led-wordmark";
import { ContactForm, type ContactAction } from "@features/studio/components/contact-form";
import { PixelMark } from "@features/studio/components/pixel-mark";
import { DOTTED_CELL_INSET, SOLID_CELL_INSET } from "@features/studio/lib/led-insets";
import { STUDIO_COPY } from "@features/studio/lib/studio-copy";
import { STUDIO_CONTACT_SECTION_ID } from "@features/studio/lib/studio-links";

const { contact } = STUDIO_COPY;

/** The closing call: "Empieza tu historia" in LED letters and the form on a tilted card. */
export function ContactSection({ action }: Readonly<{ action: ContactAction }>) {
  return (
    <section
      id={STUDIO_CONTACT_SECTION_ID}
      aria-labelledby="contact-heading"
      className="overflow-hidden section-block pb-[clamp(64px,9vw,140px)]"
    >
      <div className="page-wrap">
        <p className="m-0 max-w-[34ch] type-wide text-[clamp(16px,1.8vw,26px)] leading-[1.2] tracking-[-.02em]">
          {contact.intro}
        </p>
        <ContactHeading />
        <div className="mx-auto mt-[clamp(40px,6vw,88px)] max-w-[980px] scroll-settle [--settle-tilt:5deg]">
          <div className="rotate-[-1.5deg] bg-paper p-[clamp(20px,4vw,56px)] text-paper-foreground shadow-[16px_16px_0_0_var(--accent)]">
            <h3 className="mt-0 mb-6 flex items-center gap-3 type-mono">
              <PixelMark />
              {contact.formTitle}
            </h3>
            <ContactForm action={action} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactHeading() {
  return (
    <h2
      id="contact-heading"
      className="mt-[clamp(28px,4vw,56px)] mb-0 flex flex-col items-start gap-[clamp(8px,1.4vw,20px)]"
    >
      <LedWordmark
        text={contact.firstLine}
        label={contact.firstLine}
        cellInset={SOLID_CELL_INSET}
        className="block h-[clamp(52px,11vw,180px)] w-auto max-w-full fill-accent"
      />
      <LedWordmark
        text={contact.secondLine}
        label={contact.secondLine}
        cellInset={DOTTED_CELL_INSET}
        className="block h-[clamp(40px,8vw,140px)] w-auto max-w-full fill-foreground"
      />
    </h2>
  );
}
