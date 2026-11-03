import { useSyncExternalStore } from "react";
import { detectInstallPlatform, type InstallPlatform } from "@features/pwa/lib/install-platform";
import { hasInstallPrompt, promptInstall, subscribeInstallPrompt } from "@features/pwa/lib/install-prompt-store";

interface InstallState {
  platform: InstallPlatform;
  /** The browser offered its install dialog (Chrome, Edge, Samsung Internet). */
  canPrompt: boolean;
  install: () => Promise<void>;
}

export function useInstallState(): InstallState {
  const platform = useSyncExternalStore(subscribeNothing, readPlatform, readServerPlatform);
  const canPrompt = useSyncExternalStore(subscribeInstallPrompt, hasInstallPrompt, readServerCanPrompt);

  return { platform, canPrompt, install: promptInstall };
}

// The platform does not change while the page is open.
function subscribeNothing(): () => void {
  return () => undefined;
}

function readPlatform(): InstallPlatform {
  const isIosStandalone = "standalone" in navigator && navigator.standalone === true;
  const isStandalone = isIosStandalone || window.matchMedia("(display-mode: standalone)").matches;

  return detectInstallPlatform({ userAgent: navigator.userAgent, isStandalone });
}

function readServerPlatform(): InstallPlatform {
  return "other";
}

function readServerCanPrompt(): boolean {
  return false;
}
