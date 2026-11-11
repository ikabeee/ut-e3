import { render } from "@testing-library/react";
import { ServiceWorkerRegistration } from "@features/pwa/components/service-worker-registration";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("ServiceWorkerRegistration", () => {
  it("renders nothing", () => {
    const { container } = render(<ServiceWorkerRegistration />);

    expect(container).toBeEmptyDOMElement();
  });

  it("does not register the worker outside production, where cached chunks would hide the changes of the code", () => {
    const register = jest.fn(async () => undefined);

    Object.defineProperty(window.navigator, "serviceWorker", { configurable: true, value: { register } });

    render(<ServiceWorkerRegistration />);

    expect(register).not.toHaveBeenCalled();
  });

  it("keeps capturing the install prompt on the page it is mounted in", () => {
    const addEventListener = jest.spyOn(window, "addEventListener");

    const { unmount } = render(<ServiceWorkerRegistration />);

    expect(addEventListener).toHaveBeenCalledWith("beforeinstallprompt", expect.any(Function));

    const removeEventListener = jest.spyOn(window, "removeEventListener");

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith("beforeinstallprompt", expect.any(Function));
  });
});
