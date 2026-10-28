import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommandButton, type TournamentAction } from "@features/tournament/components/command-button";
import type { TournamentActionState } from "@features/tournament/lib/tournament-actions";

describe("CommandButton", () => {
  it("sends the command in the form and tells the screen to refresh when it was applied", async () => {
    const { received, action } = recordingAction({ status: "applied" });
    const onApplied = jest.fn();

    render(
      <CommandButton
        action={action}
        onApplied={onApplied}
        label="Iniciar combate"
        command={{ type: "start_match", matchId: "match-1" }}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Iniciar combate" }));

    await waitFor(() => expect(onApplied).toHaveBeenCalledTimes(1));
    expect(received).toHaveLength(1);
    expect(received[0].get("type")).toBe("start_match");
    expect(received[0].get("matchId")).toBe("match-1");
    expect(received[0].getAll("slot")).toEqual([]);
  });

  it("sends one slot field for each player named by the command", async () => {
    const { received, action } = recordingAction({ status: "applied" });

    render(
      <CommandButton
        action={action}
        onApplied={jest.fn()}
        label="Descalificar a los dos"
        command={{ type: "disqualify", matchId: "match-31", slots: [0, 1] }}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Descalificar a los dos" }));

    await waitFor(() => expect(received).toHaveLength(1));
    expect(received[0].getAll("slot")).toEqual(["0", "1"]);
  });

  it("asks before sending a command that cannot be undone", async () => {
    const { received, action } = recordingAction({ status: "applied" });

    render(
      <CommandButton
        action={action}
        onApplied={jest.fn()}
        label="Pierde Neo"
        needsConfirmation
        command={{ type: "finish_match", matchId: "match-1", slots: [1] }}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Pierde Neo" }));

    expect(received).toHaveLength(0);
    expect(screen.getByText("¿Seguro? Esta acción queda en la bitácora.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Confirmar: Pierde Neo" }));

    await waitFor(() => expect(received).toHaveLength(1));
    expect(received[0].get("type")).toBe("finish_match");
  });

  it("lets the person back out of the confirmation", async () => {
    const { received, action } = recordingAction({ status: "applied" });

    render(
      <CommandButton
        action={action}
        onApplied={jest.fn()}
        label="Pierde Neo"
        needsConfirmation
        command={{ type: "finish_match", matchId: "match-1", slots: [1] }}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Pierde Neo" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(received).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Pierde Neo" })).toBeInTheDocument();
  });

  it("shows the message of a command that was rejected and does not refresh", async () => {
    const { action } = recordingAction({ status: "error", message: "No puedes capturar este combate." });
    const onApplied = jest.fn();

    render(
      <CommandButton
        action={action}
        onApplied={onApplied}
        label="Iniciar combate"
        command={{ type: "start_match", matchId: "match-1" }}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Iniciar combate" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No puedes capturar este combate.");
    expect(onApplied).not.toHaveBeenCalled();
  });
});

function recordingAction(result: TournamentActionState) {
  const received: FormData[] = [];

  const action: TournamentAction = async (_previous, form) => {
    received.push(form);

    return result;
  };

  return { received, action };
}
