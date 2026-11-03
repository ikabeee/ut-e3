import {
  hasInstallPrompt,
  promptInstall,
  startCapturingInstallPrompt,
  subscribeInstallPrompt,
  type BeforeInstallPromptEvent,
} from "@features/pwa/lib/install-prompt-store";

let stopCapturing: () => void = () => undefined;

afterEach(() => {
  window.dispatchEvent(new Event("appinstalled"));
  stopCapturing();
});

describe("the install prompt store", () => {
  it("keeps the event the browser fires, without letting it show its own banner", () => {
    stopCapturing = startCapturingInstallPrompt();

    const { event } = createInstallEvent("accepted");

    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(hasInstallPrompt()).toBe(true);
  });

  it("tells the subscribers and lets them stop listening", () => {
    stopCapturing = startCapturingInstallPrompt();

    const listener = jest.fn();
    const unsubscribe = subscribeInstallPrompt(listener);

    window.dispatchEvent(createInstallEvent("accepted").event);
    unsubscribe();
    window.dispatchEvent(new Event("appinstalled"));

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("opens the install dialog once and forgets the event after the answer", async () => {
    stopCapturing = startCapturingInstallPrompt();

    const { event, prompt } = createInstallEvent("dismissed");

    window.dispatchEvent(event);
    await promptInstall();
    await promptInstall();

    expect(prompt).toHaveBeenCalledTimes(1);
    expect(hasInstallPrompt()).toBe(false);
  });

  it("forgets the event when the app gets installed", () => {
    stopCapturing = startCapturingInstallPrompt();

    window.dispatchEvent(createInstallEvent("accepted").event);
    window.dispatchEvent(new Event("appinstalled"));

    expect(hasInstallPrompt()).toBe(false);
  });

  it("stops capturing events once it is told to", () => {
    stopCapturing = startCapturingInstallPrompt();
    stopCapturing();

    window.dispatchEvent(createInstallEvent("accepted").event);

    expect(hasInstallPrompt()).toBe(false);
  });
});

function createInstallEvent(outcome: "accepted" | "dismissed") {
  const prompt = jest.fn(async () => undefined);

  const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
    prompt,
    userChoice: Promise.resolve({ outcome }),
  }) satisfies BeforeInstallPromptEvent;

  return { event, prompt };
}
