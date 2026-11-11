import { render, screen } from "@testing-library/react";
import type { ActivationState } from "@features/accounts/lib/activation-actions";
import { ActivateView } from "@features/accounts/pages/activate-page";

const action = async (): Promise<ActivationState> => ({ error: "" });

describe("ActivateView", () => {
  it("greets the person by name and shows the form while the link is valid", () => {
    render(<ActivateView state={{ status: "valid", name: "Ana Pérez" }} token="the-token" action={action} />);

    expect(screen.getByRole("heading", { name: "Activa tu cuenta" })).toBeInTheDocument();
    expect(screen.getByText(/Hola, Ana Pérez/)).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña nueva")).toBeInTheDocument();
  });

  it("tells the person to ask for another invitation when the link expired, with no form", () => {
    render(<ActivateView state={{ status: "expired" }} token="the-token" action={action} />);

    expect(screen.getByText(/venció/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Contraseña nueva")).not.toBeInTheDocument();
  });

  it("gives one neutral message for a link that is unknown or already used, with a way to sign in", () => {
    render(<ActivateView state={{ status: "invalid" }} token="the-token" action={action} />);

    expect(screen.getByText(/no es válido o ya se usó/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir a iniciar sesión" })).toHaveAttribute("href", "/login");
    expect(screen.queryByLabelText("Contraseña nueva")).not.toBeInTheDocument();
  });
});
