import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelfEntryPanel } from "@features/tournament/components/self-entry-panel";
import { TOURNAMENT_COPY } from "@features/tournament/lib/tournament-copy";

const COPY = TOURNAMENT_COPY.ui.entries.selfEntry;

const OPENS_AT = "2026-11-13T05:00:00.000Z";

describe("SelfEntryPanel", () => {
  it("offers the button while the list is open and shows the answer of the action", async () => {
    const action = jest.fn().mockResolvedValue({ status: "done", message: COPY.enrolled });

    render(<SelfEntryPanel availability="open" registrationOpensAt={OPENS_AT} action={action} />);
    await userEvent.click(screen.getByRole("button", { name: COPY.submit }));

    expect(action).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("status")).toHaveTextContent(COPY.enrolled);
  });

  it.each([
    ["closed", COPY.closed],
    ["full", COPY.full],
    ["excluded", COPY.excluded],
  ] as const)("shows %s without a button", (availability, message) => {
    render(<SelfEntryPanel availability={availability} registrationOpensAt={OPENS_AT} action={jest.fn()} />);

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows when the list opens", () => {
    render(<SelfEntryPanel availability="notOpen" registrationOpensAt={OPENS_AT} action={jest.fn()} />);

    expect(screen.getByText(COPY.notOpen("13.11.2026"))).toBeInTheDocument();
  });
});
