import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InstallAppPrompt } from "@features/pwa/components/install-app-prompt";
import { startCapturingInstallPrompt } from "@features/pwa/lib/install-prompt-store";
import { PWA_COPY } from "@features/pwa/lib/pwa-copy";

const COPY = PWA_COPY.install;

const SAFARI_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

let stopCapturing: () => void = () => undefined;

beforeEach(() => {
  stopCapturing = startCapturingInstallPrompt();
});

afterEach(() => {
  act(() => {
    window.dispatchEvent(new Event("appinstalled"));
  });
  stopCapturing();
  jest.restoreAllMocks();
});

describe("InstallAppPrompt (item 7)", () => {
  it("shows nothing when the browser offers no install and it is not Safari on iPhone", () => {
    const { container } = render(<InstallAppPrompt />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the install button once the browser offers it, and opens the dialog of the browser", async () => {
    render(<InstallAppPrompt />);

    const prompt = fireInstallEvent();

    await userEvent.click(await screen.findByRole("button", { name: COPY.button }));

    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it("hides the button when the app gets installed", async () => {
    render(<InstallAppPrompt />);
    fireInstallEvent();

    expect(await screen.findByRole("button", { name: COPY.button })).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });

    expect(screen.queryByRole("button", { name: COPY.button })).not.toBeInTheDocument();
  });

  it("gives Safari on iPhone the steps Compartir, Añadir a pantalla de inicio", () => {
    jest.spyOn(window.navigator, "userAgent", "get").mockReturnValue(SAFARI_IPHONE);

    render(<InstallAppPrompt />);

    expect(screen.getByText(COPY.iosTitle)).toBeInTheDocument();
    expect(screen.getByText(COPY.iosSteps)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: COPY.button })).not.toBeInTheDocument();
  });

  it("shows nothing when the app already runs from the home screen", () => {
    jest.spyOn(window.navigator, "userAgent", "get").mockReturnValue(SAFARI_IPHONE);
    stubDisplayMode({ isStandalone: true });

    const { container } = render(<InstallAppPrompt />);

    expect(container).toBeEmptyDOMElement();
  });
});

// jest.setup.ts gives jsdom a matchMedia that never matches; this one answers that the app runs from the home screen.
function stubDisplayMode({ isStandalone }: { isStandalone: boolean }) {
  jest.spyOn(window, "matchMedia").mockImplementation((query) => ({
    matches: isStandalone,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }));
}

function fireInstallEvent() {
  const prompt = jest.fn(async () => undefined);

  const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
    prompt,
    userChoice: Promise.resolve({ outcome: "dismissed" as const }),
  });

  act(() => {
    window.dispatchEvent(event);
  });

  return prompt;
}
