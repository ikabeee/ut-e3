import type { ReactNode } from "react";
import { Disclosure } from "@heroui/react";

interface AdminDisclosureProps {
  label: string;
  children: ReactNode;
}

/** Sección plegable del panel (Disclosure de HeroUI): esconde los formularios de edición. */
export function AdminDisclosure({ label, children }: Readonly<AdminDisclosureProps>) {
  return (
    <Disclosure className="border-t border-border">
      <Disclosure.Heading>
        <Disclosure.Trigger className="flex min-h-11 w-full items-center justify-between gap-3 type-tiny">
          {label}
          <Disclosure.Indicator />
        </Disclosure.Trigger>
      </Disclosure.Heading>
      <Disclosure.Content>
        <Disclosure.Body className="pt-2 pb-4">{children}</Disclosure.Body>
      </Disclosure.Content>
    </Disclosure>
  );
}
