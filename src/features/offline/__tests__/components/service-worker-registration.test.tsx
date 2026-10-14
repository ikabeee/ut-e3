import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ServiceWorkerRegistration } from "@features/offline/components/service-worker-registration";

describe("ServiceWorkerRegistration", () => {
  it("renders nothing visible while there is no new version", () => {
    const useWorker = () => ({ isUpdateAvailable: false, applyUpdate: jest.fn() });
    render(<ServiceWorkerRegistration useWorker={useWorker} />);

    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("offers the new version and applies it on press", async () => {
    const applyUpdate = jest.fn();
    const useWorker = () => ({ isUpdateAvailable: true, applyUpdate });
    render(<ServiceWorkerRegistration useWorker={useWorker} />);

    expect(screen.getByRole("status")).toHaveTextContent("Hay una versión nueva del sitio.");
    await userEvent.setup().click(screen.getByRole("button", { name: "Actualizar" }));
    expect(applyUpdate).toHaveBeenCalledTimes(1);
  });
});
