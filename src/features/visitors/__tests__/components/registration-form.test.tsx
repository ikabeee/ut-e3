import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegistrationForm } from "@features/visitors/components/registration-form";
import type { RegistrationState } from "@features/visitors/lib/visitors-actions";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

const COPY = VISITORS_COPY.form;

describe("RegistrationForm", () => {
  it("renders inputs with min-h-11 and text-base classes and accessible labels", () => {
    render(<RegistrationForm action={async () => ({})} />);

    const nameInput = screen.getByLabelText(COPY.fullNameLabel);
    const gamertagInput = screen.getByLabelText(COPY.gamertagLabel);
    const emailInput = screen.getByLabelText(COPY.emailLabel);

    expect(nameInput).toHaveClass("min-h-11", "text-base");
    expect(gamertagInput).toHaveClass("min-h-11", "text-base");
    expect(emailInput).toHaveClass("min-h-11", "text-base");
    expect(screen.getByRole("button", { name: COPY.submit })).toBeInTheDocument();
  });

  it("submits input values and renders action error alert", async () => {
    const received: FormData[] = [];

    const action = async (_prev: RegistrationState | null, form: FormData) => {
      received.push(form);

      return {
        error: "Error del servidor",
        values: {
          fullName: "Thomas Anderson",
          gamertag: "Neo",
          email: "neo@matrix.org",
        },
      };
    };

    render(<RegistrationForm action={action} />);
    await userEvent.type(screen.getByLabelText(COPY.fullNameLabel), "Thomas Anderson");
    await userEvent.type(screen.getByLabelText(COPY.gamertagLabel), "Neo");
    await userEvent.type(screen.getByLabelText(COPY.emailLabel), "neo@matrix.org");
    await userEvent.click(screen.getByRole("button", { name: COPY.submit }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Error del servidor");
    expect(received).toHaveLength(1);
    expect(received[0].get("fullName")).toBe("Thomas Anderson");
    expect(received[0].get("gamertag")).toBe("Neo");
    expect(received[0].get("email")).toBe("neo@matrix.org");
  });
});
