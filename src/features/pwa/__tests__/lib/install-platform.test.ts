import { detectInstallPlatform } from "@features/pwa/lib/install-platform";

const SAFARI_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

const CHROME_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1";

const CHROME_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";

describe("detectInstallPlatform", () => {
  it("gives Safari on iPhone the written steps, since it never fires beforeinstallprompt", () => {
    expect(detectInstallPlatform({ userAgent: SAFARI_IPHONE, isStandalone: false })).toBe("ios");
  });

  it("does not give steps to the other browsers of iPhone, which cannot add to the home screen", () => {
    expect(detectInstallPlatform({ userAgent: CHROME_IPHONE, isStandalone: false })).toBe("other");
  });

  it("leaves Android and desktop to the install dialog of the browser", () => {
    expect(detectInstallPlatform({ userAgent: CHROME_ANDROID, isStandalone: false })).toBe("other");
  });

  it("knows when the app already runs from the home screen", () => {
    expect(detectInstallPlatform({ userAgent: SAFARI_IPHONE, isStandalone: true })).toBe("installed");
    expect(detectInstallPlatform({ userAgent: CHROME_ANDROID, isStandalone: true })).toBe("installed");
  });
});
