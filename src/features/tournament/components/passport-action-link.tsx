"use client";

import { useSyncExternalStore } from "react";
import { ActionLink } from "@shared/components/action-link";

interface PassportActionLinkProps {
  /** Built by the page from the `visitors` links: registration binds a device to a passport (RF-18). */
  registerHref: string;
  passportHref: string;
  /** Where the phone keeps the copy of its passport (`PASSPORT_SNAPSHOT_KEY` of `visitors`); the page passes it. */
  snapshotKey: string;
  registerLabel: string;
  passportLabel: string;
}

/**
 * One link, never both (S30): "Ver mi pasaporte" when this device keeps a passport copy, "Crear mi pasaporte" otherwise.
 * The page stays static, so the server and the first render do not know it yet and offer to create it.
 */
export function PassportActionLink({
  registerHref,
  passportHref,
  snapshotKey,
  registerLabel,
  passportLabel,
}: Readonly<PassportActionLinkProps>) {
  const hasPassport = useSyncExternalStore(subscribe, () => readHasPassport(snapshotKey), readServerHasPassport);

  return hasPassport ? (
    <ActionLink href={passportHref}>{passportLabel}</ActionLink>
  ) : (
    <ActionLink href={registerHref} variant="primary">
      {registerLabel}
    </ActionLink>
  );
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);

  return () => window.removeEventListener("storage", onChange);
}

// localStorage can be missing or throw (private windows, blocked storage): that reads as no passport.
function readHasPassport(key: string): boolean {
  try {
    return window.localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

function readServerHasPassport(): boolean {
  return false;
}
