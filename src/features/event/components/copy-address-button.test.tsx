import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CopyAddressButton } from "@features/event/components/copy-address-button";

function renderButton() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <CopyAddressButton address="UT Cancún, Km 11.5" />
    </QueryClientProvider>,
  );
}

describe("CopyAddressButton", () => {
  it("copies the address and confirms it", async () => {
    const user = userEvent.setup();
    const writeText = jest.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    renderButton();

    await user.click(screen.getByRole("button", { name: "Copiar dirección" }));

    expect(writeText).toHaveBeenCalledWith("UT Cancún, Km 11.5");
    expect(await screen.findByRole("button", { name: "Dirección copiada" })).toBeInTheDocument();
  });

  it("tells the user when the copy fails", async () => {
    const user = userEvent.setup();
    jest.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
    renderButton();

    await user.click(screen.getByRole("button", { name: "Copiar dirección" }));

    expect(await screen.findByRole("button", { name: "No se pudo copiar" })).toBeInTheDocument();
  });
});
