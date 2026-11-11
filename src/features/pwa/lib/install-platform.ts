export type InstallPlatform = "installed" | "ios" | "other";

interface PlatformSignals {
  userAgent: string;
  /** The app already runs from the home screen (display-mode standalone or navigator.standalone). */
  isStandalone: boolean;
}

const IOS_PATTERN = /iPad|iPhone|iPod/;

const IOS_OTHER_BROWSERS = /CriOS|FxiOS|EdgiOS|OPiOS/;

/**
 * How the visitor can install the app. Safari on iPhone never fires `beforeinstallprompt`, so it gets written steps;
 * the other iOS browsers cannot add to the home screen from the page, so they get nothing.
 */
export function detectInstallPlatform({ userAgent, isStandalone }: PlatformSignals): InstallPlatform {
  if (isStandalone) return "installed";

  const isIos = IOS_PATTERN.test(userAgent);

  return isIos && !IOS_OTHER_BROWSERS.test(userAgent) ? "ios" : "other";
}
