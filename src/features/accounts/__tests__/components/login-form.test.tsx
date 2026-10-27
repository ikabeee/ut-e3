import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@features/accounts/components/login-form";
import type { SignInState } from "@features/accounts/lib/accounts-actions";

describe("LoginForm", () => {
  it("labels the email and password fields and their 16 px inputs", () => {
    render(<LoginForm action={async () => ({ error: "" })} />);

    expect(screen.getByLabelText("Correo")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Correo")).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("type", "password");
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("autocomplete", "current-password");
    expect(screen.getByLabelText("Correo")).toHaveClass("text-base");
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });

  it("sends the typed email and password and shows the error the action returns", async () => {
    const received: FormData[] = [];

    const action = async (_previous: SignInState | null, form: FormData) => {
      received.push(form);

      return { error: "Correo o contraseña incorrectos" };
    };

    render(<LoginForm action={action} />);
    await userEvent.type(screen.getByLabelText("Correo"), "admin@ut.mx");
    await userEvent.type(screen.getByLabelText("Contraseña"), "secreta");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Correo o contraseña incorrectos");
    expect(screen.getByLabelText("Correo")).toHaveValue("admin@ut.mx");
    expect(received.map((form) => [form.get("email"), form.get("password")])).toEqual([["admin@ut.mx", "secreta"]]);
  });
});
