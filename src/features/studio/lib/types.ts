/** The background of a discipline card: each one uses a tone of the UTG palette. */
export type DisciplineTone = "paper" | "accent" | "panel" | "deep";

export interface StudioLink {
  label: string;
  href: string;
}

/** A card of the stacked "Qué hacemos" block. */
export interface Discipline {
  id: string;
  /** The small verb above the title, such as "Pensamos". */
  eyebrow: string;
  title: string;
  description: string;
  /** Skills: the first ones are shown, then a "+N" counter with the rest. */
  tags: string[];
  cta: StudioLink;
  tone: DisciplineTone;
}

/** A quote of the "Lo que dicen" board. */
export interface Testimonial {
  id: string;
  quote: string;
  /** Who says it: a role, not a name, while the quotes are samples. */
  author: string;
  /** Tilt of the card in degrees. */
  tilt: number;
}

export interface ContactMessage {
  email: string;
  name: string;
  organization: string;
  message: string;
}

export type ContactField = keyof ContactMessage | "consent";

export interface ContactErrors {
  email?: string;
  name?: string;
  organization?: string;
  message?: string;
  consent?: string;
}

/** What the Server Action of the contact form answers. */
export type ContactFormState =
  { status: "idle" } | { status: "invalid"; errors: ContactErrors } | { status: "sent"; message: string };
