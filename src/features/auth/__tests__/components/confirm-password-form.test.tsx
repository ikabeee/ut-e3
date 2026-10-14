import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmPasswordForm } from "@features/auth/components/confirm-password-form";
import { actionError, actionOk } from "@shared/lib/action-result";

describe("ConfirmPasswordForm", () => {
  it("renders form fields and helper info", () => {
    render(
      <ConfirmPasswordForm
        token="valid-token-1234567890abcdef123"
        fullName="Ana López"
        email="alopez@ute3.edu.mx"
        action={jest.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Establece tu contraseña" })).toBeInTheDocument();
    expect(screen.getByText(/Ana López/)).toBeInTheDocument();
    expect(screen.getByLabelText("Nueva contraseña")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirmar contraseña")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirmar y establecer contraseña" })).toBeInTheDocument();
  });

  it("shows success message on successful password submission", async () => {
    const user = userEvent.setup();
    const action = jest.fn().mockResolvedValue(actionOk({ confirmed: true }));

    render(
      <ConfirmPasswordForm
        token="valid-token-1234567890abcdef123"
        fullName="Ana López"
        email="alopez@ute3.edu.mx"
        action={action}
      />,
    );

    await user.type(screen.getByLabelText("Nueva contraseña"), "SecurePassword123!");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "SecurePassword123!");
    await user.click(screen.getByRole("button", { name: "Confirmar y establecer contraseña" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "¡Cuenta activada!" })).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: "Ir a iniciar sesión" })).toHaveAttribute("href", "/login");
  });

  it("shows error alert when action returns an error", async () => {
    const user = userEvent.setup();
    const action = jest.fn().mockResolvedValue(actionError("El enlace de confirmación no es válido o ya ha expirado."));

    render(
      <ConfirmPasswordForm
        token="valid-token-1234567890abcdef123"
        fullName="Ana López"
        email="alopez@ute3.edu.mx"
        action={action}
      />,
    );

    await user.type(screen.getByLabelText("Nueva contraseña"), "SecurePassword123!");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "SecurePassword123!");
    await user.click(screen.getByRole("button", { name: "Confirmar y establecer contraseña" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El enlace de confirmación no es válido o ya ha expirado.",
    );
  });
});
