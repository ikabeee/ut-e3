import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CopyAddressButton } from "@features/landing/components/copy-address-button";

const ADDRESS = "Universidad Tecnológica de Cancún, Km 11.5";

function stubClipboard(writeText: jest.Mock) {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
}

function renderButton() {
  const user = userEvent.setup();
  render(<CopyAddressButton address={ADDRESS} />);

  return user;
}

describe("CopyAddressButton", () => {
  it("copies the address to the clipboard and confirms it", async () => {
    const user = renderButton();
    const writeText = jest.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);

    await user.click(screen.getByRole("button", { name: "Copiar dirección" }));

    expect(writeText).toHaveBeenCalledWith(ADDRESS);
    expect(await screen.findByRole("button", { name: "Dirección copiada" })).toBeInTheDocument();
  });

  it("tells the user when the clipboard rejects the copy", async () => {
    const user = renderButton();
    stubClipboard(jest.fn().mockRejectedValue(new Error("denied")));

    await user.click(screen.getByRole("button", { name: "Copiar dirección" }));

    expect(await screen.findByRole("button", { name: "No se pudo copiar" })).toBeInTheDocument();
  });
});
