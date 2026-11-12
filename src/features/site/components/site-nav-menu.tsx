"use client";

import { Button, Drawer } from "@heroui/react";
import Link from "next/link";
import { useState } from "react";
import { SITE_COPY } from "@features/site/lib/site-copy";
import type { SiteNavLink } from "@features/site/lib/site-navigation";

interface SiteNavMenuProps {
  links: SiteNavLink[];
  currentHref?: string;
}

/**
 * The menu of the navbar below 1024 px, where the six entries do not fit next to the logo and Mi pasaporte. The drawer
 * (React Aria Modal) traps the focus, closes with Escape or a tap outside and returns the focus to the button.
 */
export function SiteNavMenu({ links, currentHref }: Readonly<SiteNavMenuProps>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-none items-center border-l border-separator lg:hidden">
      <Drawer isOpen={isOpen} onOpenChange={setIsOpen}>
        <Button variant="tertiary" isIconOnly aria-label={SITE_COPY.nav.openMenu} className="size-11 min-w-11">
          <MenuIcon />
        </Button>
        <Drawer.Backdrop>
          <Drawer.Content placement="right">
            <Drawer.Dialog>
              <Drawer.CloseTrigger aria-label={SITE_COPY.nav.closeMenu} className="size-11" />
              <Drawer.Header>
                <Drawer.Heading className="type-mono">{SITE_COPY.nav.menuTitle}</Drawer.Heading>
              </Drawer.Header>
              <Drawer.Body>
                <MenuLinks links={links} currentHref={currentHref} onChoose={() => setIsOpen(false)} />
              </Drawer.Body>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

interface MenuLinksProps extends SiteNavMenuProps {
  onChoose: () => void;
}

function MenuLinks({ links, currentHref, onChoose }: Readonly<MenuLinksProps>) {
  return (
    <ul className="m-0 flex list-none flex-col p-0 font-nav text-base font-medium tracking-[.02em] uppercase">
      {links.map((link) => (
        <li key={link.href} className="border-b border-separator">
          <Link
            href={link.href}
            aria-current={link.href === currentHref ? "page" : undefined}
            onClick={onChoose}
            className="flex min-h-12 items-center no-underline aria-[current=page]:text-accent"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
