import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginCodeForm } from "@features/accounts/components/login-code-form";
import type { LoginCodeState } from "@features/accounts/lib/login-code-actions";

describe("LoginCodeForm", () => {
  it("labels a 16 px one-time-code field and sends the typed code", async () => {
    const received: FormData[] = [];

    const verifyAction = async (_previous: LoginCodeState | null, form: FormData) => {
      received.push(form);

      return { error: "El código es incorrecto o venció. Pide uno nuevo.", notice: "" };
    };

    render(<LoginCodeForm verifyAction={verifyAction} resendAction={async () => ({ error: "", notice: "" })} />);

    expect(screen.getByLabelText("Código de 6 dígitos")).toHaveAttribute("autocomplete", "one-time-code");
    expect(screen.getByLabelText("Código de 6 dígitos")).toHaveClass("text-base", "min-h-11");

    await userEvent.type(screen.getByLabelText("Código de 6 dígitos"), "123456");
    await userEvent.click(screen.getByRole("button", { name: "Verificar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("El código es incorrecto o venció");
    expect(received.map((form) => form.get("code"))).toEqual(["123456"]);
  });

  it("shows what the resend answers", async () => {
    const resendAction = async () => ({ error: "", notice: "Te enviamos un código nuevo." });

    render(<LoginCodeForm verifyAction={async () => ({ error: "", notice: "" })} resendAction={resendAction} />);
    await userEvent.click(screen.getByRole("button", { name: "Reenviar código" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Te enviamos un código nuevo.");
  });
});
