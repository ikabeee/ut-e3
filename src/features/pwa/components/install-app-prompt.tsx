"use client";

import { Button } from "@heroui/react";
import { useInstallState } from "@features/pwa/hooks/use-install-state";
import { PWA_COPY } from "@features/pwa/lib/pwa-copy";

const COPY = PWA_COPY.install;

/**
 * Invites the visitor to install the app. Chrome and Edge give a button that opens their own dialog; Safari on iPhone
 * never fires that event, so it gets the steps to follow. Once installed (or in other browsers) it shows nothing.
 */
export function InstallAppPrompt() {
  const { platform, canPrompt, install } = useInstallState();

  if (platform === "installed") return null;

  if (canPrompt) {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <Button variant="outline" className="min-h-11" onPress={() => void install()}>
          {COPY.button}
        </Button>
        <p className="type-tiny text-muted">{COPY.hint}</p>
      </div>
    );
  }

  if (platform === "ios") {
    return (
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="type-mono">{COPY.iosTitle}</p>
        <p className="max-w-[40ch] type-tiny text-muted">{COPY.iosSteps}</p>
      </div>
    );
  }

  return null;
}
