import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountPageHeader } from "@features/accounts/components/account-page-header";

describe("AccountPageHeader", () => {
  it("shows the title and who is signed in", () => {
    render(<AccountPageHeader title="Mesa" signedInAs="Sesión de Ana" signOutAction={async () => {}} />);

    expect(screen.getByRole("heading", { level: 1, name: "Mesa" })).toBeInTheDocument();
    expect(screen.getByText("Sesión de Ana")).toBeInTheDocument();
  });

  it("links to the page of the role of the account", () => {
    render(<AccountPageHeader title="Mesa" signedInAs="Sesión de Ana" signOutAction={async () => {}} />);

    const link = screen.getByRole("link", { name: "Mi rol" });

    expect(link).toHaveAttribute("href", "/my-role");
    expect(link).toHaveClass("min-h-11");
  });

  it("leaves the link out on the page of the role itself", () => {
    render(
      <AccountPageHeader
        title="Mi rol"
        signedInAs="Sesión de Ana"
        signOutAction={async () => {}}
        showRoleLink={false}
      />,
    );

    expect(screen.queryByRole("link", { name: "Mi rol" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeInTheDocument();
  });

  it("runs the sign out action from the button", async () => {
    const calls: string[] = [];

    render(
      <AccountPageHeader
        title="Mesa"
        signedInAs="Sesión de Ana"
        signOutAction={async () => {
          calls.push("signOut");
        }}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    await waitFor(() => expect(calls).toEqual(["signOut"]));
  });
});
