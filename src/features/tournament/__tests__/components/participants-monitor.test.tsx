import { act, render, screen } from "@testing-library/react";
import { ParticipantsMonitor } from "@features/tournament/components/participants-monitor";
import { POLL_INTERVAL_MS } from "@features/tournament/hooks/use-tournament";
import type { EntryView } from "@features/tournament/lib/types";
import { renderWithToasts } from "@shared/__tests__/components/toast-test-utils";

const FIRST: EntryView = {
  id: "entry-1",
  visitorId: "visitor-1",
  gamertag: "Jugador1",
  channel: "pre",
  status: "registered",
  checkedInAt: null,
};

// S26 and S11: the sysadmin watches the participants as the KOF administrator adds them, without reloading.
describe("ParticipantsMonitor", () => {
  it("shows the participants the server rendered, with no way to change them", () => {
    render(<ParticipantsMonitor initial={[FIRST]} hasBracket={false} load={async () => [FIRST]} />);

    expect(screen.getByText("Jugador1")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("brings in the participants added since, on the next poll", async () => {
    jest.useFakeTimers();

    try {
      const second: EntryView = { ...FIRST, id: "entry-2", visitorId: "visitor-2", gamertag: "Jugador2" };
      const load = jest.fn().mockResolvedValue([FIRST, second]);

      render(<ParticipantsMonitor initial={[FIRST]} hasBracket={false} load={load} />);

      expect(screen.queryByText("Jugador2")).not.toBeInTheDocument();

      await act(async () => {
        await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      });

      expect(screen.getByText("Jugador2")).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  it("keeps the last list on screen when a poll fails", async () => {
    jest.useFakeTimers();

    try {
      const load = jest.fn().mockRejectedValue(new Error("offline"));

      render(<ParticipantsMonitor initial={[FIRST]} hasBracket={false} load={load} />);
      await act(async () => {
        await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      });

      expect(screen.getByText("Jugador1")).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  it("keeps the list and warns with a toast when a refresh fails (S7)", async () => {
    jest.useFakeTimers();

    try {
      const load = jest.fn().mockRejectedValue(new Error("offline"));

      renderWithToasts(<ParticipantsMonitor initial={[FIRST]} hasBracket={false} load={load} />);

      await act(async () => {
        await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      });

      expect(screen.getByRole("alert")).toHaveTextContent("Sin conexión. Se muestra el último estado recibido.");
      expect(screen.getByText("Jugador1")).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });
});
