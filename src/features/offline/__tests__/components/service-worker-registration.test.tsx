import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ServiceWorkerRegistration } from "@features/offline/components/service-worker-registration";
import { useServiceWorker } from "@features/offline/hooks/use-service-worker";

jest.mock("@features/offline/hooks/use-service-worker", () => ({ useServiceWorker: jest.fn() }));

describe("ServiceWorkerRegistration", () => {
  it("renders nothing visible while there is no new version", () => {
    jest.mocked(useServiceWorker).mockReturnValue({ isUpdateAvailable: false, applyUpdate: jest.fn() });
    render(<ServiceWorkerRegistration />);

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("offers the new version and applies it on press", async () => {
    const applyUpdate = jest.fn();
    jest.mocked(useServiceWorker).mockReturnValue({ isUpdateAvailable: true, applyUpdate });
    render(<ServiceWorkerRegistration />);

    expect(screen.getByRole("status")).toHaveTextContent("Hay una versión nueva del sitio.");
    await userEvent.setup().click(screen.getByRole("button", { name: "Actualizar" }));
    expect(applyUpdate).toHaveBeenCalledTimes(1);
  });
});
