import { screen, within } from "@testing-library/react";
import { FormSubmit } from "@shared/components/form-submit";
import { renderWithToasts } from "@shared/__tests__/components/toast-test-utils";

const COPY = { submit: "Guardar", pending: "Guardando..." };

const ERROR = "No se pudo guardar.";

describe("FormSubmit", () => {
  it("shows the error of the last attempt in a toast, not next to the button (S7)", () => {
    const { container } = renderWithToasts(<FormSubmit error={ERROR} isPending={false} copy={COPY} />);

    expect(screen.getByRole("alert")).toHaveTextContent(ERROR);
    expect(container).not.toHaveTextContent(ERROR);
  });

  it("shows a spinner inside the button while the form is sent (S6)", () => {
    renderWithToasts(<FormSubmit isPending copy={COPY} />);

    const button = screen.getByRole("button", { name: COPY.pending });

    expect(button).toHaveAttribute("data-pending", "true");
    expect(button.querySelector('[data-slot="spinner"]')).toBeInTheDocument();
  });

  it("shows no spinner and the label of the action while idle", () => {
    renderWithToasts(<FormSubmit isPending={false} copy={COPY} />);

    const button = screen.getByRole("button", { name: COPY.submit });

    expect(button.querySelector('[data-slot="spinner"]')).not.toBeInTheDocument();
  });

  it("takes the old error away while the next attempt is sent and brings it back if the answer is the same", async () => {
    const { rerender } = renderWithToasts(<FormSubmit error={ERROR} isPending={false} copy={COPY} />);

    rerender(<FormSubmit error={ERROR} isPending copy={COPY} />);
    rerender(<FormSubmit error={ERROR} isPending={false} copy={COPY} />);

    const alerts = await screen.findAllByRole("alert");

    expect(within(alerts.at(-1) ?? document.body).getByText(ERROR)).toBeInTheDocument();
  });
});
