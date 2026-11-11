import { render, screen, within } from "@testing-library/react";
import { PIXEL_FORGE } from "@features/sponsors/__tests__/components/sponsor-test-data";
import { SponsorsAdmin } from "@features/sponsors/components/sponsors-admin";
import type { SponsorActionState } from "@features/sponsors/lib/sponsors-admin-actions";

async function noopAction(): Promise<SponsorActionState> {
  return { status: "done", message: "ok" };
}

describe("SponsorsAdmin email field", () => {
  it("offers an optional Correo field of type email in the form to create a sponsor", () => {
    render(<SponsorsAdmin sponsors={[]} saveAction={noopAction} deleteAction={noopAction} />);

    const field = screen.getByLabelText("Correo");

    expect(field).toHaveAttribute("type", "email");
    expect(field).toHaveAttribute("maxlength", "254");
    expect(field).not.toBeRequired();
    expect(field).toHaveValue("");
  });

  it("fills the Correo field of an edited sponsor, and leaves it empty when the sponsor has none", () => {
    const withEmail = { ...PIXEL_FORGE, id: "con-correo", name: "Con correo", email: "hola@pixel-forge.example" };
    const without = { ...PIXEL_FORGE, id: "sin-correo", name: "Sin correo", email: null };

    render(<SponsorsAdmin sponsors={[withEmail, without]} saveAction={noopAction} deleteAction={noopAction} />);

    const rows = within(screen.getByTestId("sponsors-admin")).getAllByRole("listitem");

    expect(within(rows[0]).getByLabelText("Correo")).toHaveValue("hola@pixel-forge.example");
    expect(within(rows[1]).getByLabelText("Correo")).toHaveValue("");
  });
});
