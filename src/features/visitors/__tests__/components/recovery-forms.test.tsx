import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecoveryConfirmForm } from "@features/visitors/components/recovery-confirm-form";
import { RecoveryEntryLink } from "@features/visitors/components/recovery-entry-link";
import { RecoveryRequestForm } from "@features/visitors/components/recovery-request-form";
import type { RecoveryRequestState } from "@features/visitors/lib/visitors-actions";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

const COPY = VISITORS_COPY.recovery;

afterEach(() => {
  window.location.hash = "";
});

describe("RecoveryRequestForm", () => {
  it("sends the email and shows the generic message", async () => {
    const received: string[] = [];

    const action = async (_previous: RecoveryRequestState | null, form: FormData): Promise<RecoveryRequestState> => {
      received.push(String(form.get("email")));

      return { status: "sent" };
    };

    render(<RecoveryRequestForm action={action} />);

    const input = screen.getByLabelText(COPY.emailLabel);

    expect(input).toHaveClass("min-h-11", "text-base");

    await userEvent.type(input, "neo@example.com");
    await userEvent.click(screen.getByRole("button", { name: COPY.submit }));

    expect(await screen.findByRole("status")).toHaveTextContent(COPY.sent);
    expect(received).toEqual(["neo@example.com"]);
  });

  it("shows the field error of an invalid email", async () => {
    const action = async (): Promise<RecoveryRequestState> => ({
      status: "invalid",
      email: "malo",
      error: VISITORS_COPY.errors.emailInvalid,
    });

    render(<RecoveryRequestForm action={action} />);
    await userEvent.type(screen.getByLabelText(COPY.emailLabel), "malo@x.com");
    await userEvent.click(screen.getByRole("button", { name: COPY.submit }));

    expect(await screen.findByText(VISITORS_COPY.errors.emailInvalid)).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

describe("RecoveryConfirmForm", () => {
  it("posts the token of the fragment when the visitor confirms", async () => {
    const received: string[] = [];

    window.location.hash = "#token-de-prueba";
    render(
      <RecoveryConfirmForm
        action={async (form) => {
          received.push(String(form.get("token")));
        }}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: COPY.confirmSubmit }));

    expect(received).toEqual(["token-de-prueba"]);
  });

  it("explains that the link is incomplete when the fragment is missing", () => {
    render(<RecoveryConfirmForm action={async () => {}} />);

    expect(screen.getByRole("alert")).toHaveTextContent(COPY.confirmMissing);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("treats a malformed fragment as an incomplete link instead of crashing", () => {
    window.location.hash = "#%E0%A4%A";
    render(<RecoveryConfirmForm action={async () => {}} />);

    expect(screen.getByRole("alert")).toHaveTextContent(COPY.confirmMissing);
  });
});

describe("RecoveryEntryLink", () => {
  it("links to the recovery page", () => {
    render(<RecoveryEntryLink />);

    expect(screen.getByRole("link", { name: COPY.entryLink })).toHaveAttribute("href", "/passport/recover");
  });
});
