import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EntriesPanel, type EntriesAction } from "@features/tournament/components/entries-panel";
import type { PinLookup } from "@features/tournament/hooks/use-pin-match";
import type { EntriesActionState } from "@features/tournament/lib/entries-actions";
import type { EntryView } from "@features/tournament/lib/types";
import { renderWithToasts } from "@shared/__tests__/components/toast-test-utils";

const ENTRIES: EntryView[] = [
  entry(1, "pre", "registered"),
  entry(2, "pre", "checked_in"),
  entry(3, "onsite", "checked_in"),
  entry(4, "pre", "no_show"),
];

describe("EntriesPanel", () => {
  it("counts the entries by status, the pre-registration list and the places in use", () => {
    renderPanel({ entries: ENTRIES, hasBracket: false });

    const counts = screen.getByRole("list", { name: "Conteo de inscripciones" });

    expect(within(counts).getByText("Lista previa 3/50")).toBeInTheDocument();
    expect(within(counts).getByText("Lugares 3/64")).toBeInTheDocument();
    expect(within(counts).getByText("Inscritos").previousElementSibling).toHaveTextContent("1");
    expect(within(counts).getByText("Con check-in").previousElementSibling).toHaveTextContent("2");
    expect(within(counts).getByText("No se presentaron").previousElementSibling).toHaveTextContent("1");
  });

  it("lists each player with the channel and the status", () => {
    renderPanel({ entries: ENTRIES, hasBracket: false });

    const row = screen.getByText("Jugador3").closest("li");

    expect(row).toHaveTextContent("Nombre Jugador3");
    expect(row).toHaveTextContent("Presencial");
    expect(row).toHaveTextContent("Con check-in");
    expect(screen.getByText("Jugador4").closest("li")).toHaveTextContent("No se presentó");
  });

  it("only shows the counts and the list to the sysadmin, who has no actions (S26)", () => {
    renderWithToasts(<EntriesPanel entries={ENTRIES} hasBracket={false} />);

    expect(screen.getByRole("list", { name: "Conteo de inscripciones" })).toBeInTheDocument();
    expect(screen.getByText("Jugador1")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    for (const name of ["Agregar al torneo", "Hacer check-in", "Generar bracket", "Reiniciar torneo"]) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
  });

  it("searches by gamertag or name and says so when nobody matches", async () => {
    renderWithToasts(<EntriesPanel entries={ENTRIES} hasBracket={false} />);

    const search = screen.getByRole("searchbox", { name: "Buscar jugador" });

    await userEvent.type(search, "nombre jugador3");

    expect(screen.getByText("Jugador3")).toBeInTheDocument();
    expect(screen.queryByText("Jugador1")).not.toBeInTheDocument();
    expect(screen.getByText("1 de 4 jugadores")).toBeInTheDocument();

    await userEvent.clear(search);
    await userEvent.type(search, "zzz");

    expect(screen.getByText("Ningún jugador coincide con la búsqueda.")).toBeInTheDocument();
  });

  it("finds a player by PIN through the server, which only answers the entry", async () => {
    const pins: string[] = [];

    const { actions } = recordingActions({ status: "done", message: "ok" }, async (pin) => {
      pins.push(pin);

      return pin === "00004" ? "entry-4" : null;
    });

    renderPanel({ entries: ENTRIES, hasBracket: false, actions });
    await userEvent.type(screen.getByRole("searchbox", { name: "Buscar jugador" }), "00004");

    expect(await screen.findByText("Jugador4")).toBeInTheDocument();
    expect(screen.queryByText("Jugador1")).not.toBeInTheDocument();
    expect(pins).toEqual(["00004"]);
  });

  it("filters by status, with the count on each filter", async () => {
    renderPanel({ entries: ENTRIES, hasBracket: false });

    const filters = screen.getByRole("radiogroup", { name: "Filtrar por estado" });

    expect(within(filters).getByRole("radio", { name: "Todos (4)" })).toBeChecked();

    await userEvent.click(within(filters).getByRole("radio", { name: "Pendientes de check-in (1)" }));

    expect(screen.getByText("Jugador1")).toBeInTheDocument();
    expect(screen.queryByText("Jugador2")).not.toBeInTheDocument();

    await userEvent.click(within(filters).getByRole("radio", { name: "Con check-in (2)" }));

    expect(screen.getByText("Jugador2")).toBeInTheDocument();
    expect(screen.getByText("Jugador3")).toBeInTheDocument();
    expect(screen.queryByText("Jugador1")).not.toBeInTheDocument();
  });

  it("says so when nobody has signed up", () => {
    renderPanel({ entries: [], hasBracket: false });

    expect(screen.getByText("Todavía no hay inscritos.")).toBeInTheDocument();
  });

  it("sends the gamertag to the add action and shows what the server answered", async () => {
    const { calls, actions } = recordingActions({ status: "done", message: "Agregado a la lista previa." });

    renderPanel({ entries: [], hasBracket: false, actions });
    await userEvent.type(screen.getByLabelText("Gamertag del jugador"), "Jugador9");
    await userEvent.click(screen.getByRole("button", { name: "Agregar al torneo" }));

    await waitFor(() => expect(calls.add).toHaveLength(1));
    expect(calls.add[0].get("gamertag")).toBe("Jugador9");
    expect(await screen.findByText("Agregado a la lista previa.")).toBeInTheDocument();
  });

  it("sends the PIN to the check-in action", async () => {
    const { calls, actions } = recordingActions({ status: "done", message: "Check-in hecho: Jugador1." });

    renderPanel({ entries: ENTRIES, hasBracket: false, actions });
    await userEvent.type(screen.getByLabelText("PIN del jugador"), "00001");
    await userEvent.click(screen.getByRole("button", { name: "Hacer check-in" }));

    await waitFor(() => expect(calls.checkIn).toHaveLength(1));
    expect(calls.checkIn[0].get("pin")).toBe("00001");
  });

  it("shows the reason when the server refuses", async () => {
    const { actions } = recordingActions({ status: "error", message: "No existe ese gamertag." });

    renderPanel({ entries: [], hasBracket: false, actions });
    await userEvent.type(screen.getByLabelText("Gamertag del jugador"), "Nadie");
    await userEvent.click(screen.getByRole("button", { name: "Agregar al torneo" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No existe ese gamertag.");
  });

  it("offers to generate the bracket until it exists", async () => {
    const { calls, actions } = recordingActions({ status: "done", message: "Bracket generado." });

    renderPanel({ entries: ENTRIES, hasBracket: false, actions });
    await userEvent.click(screen.getByRole("button", { name: "Generar bracket" }));

    await waitFor(() => expect(calls.generate).toHaveLength(1));
  });

  it("keeps only the list and the counts once the bracket exists", () => {
    renderPanel({ entries: ENTRIES, hasBracket: true });

    expect(screen.queryByLabelText("Gamertag del jugador")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("PIN del jugador")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Generar bracket" })).not.toBeInTheDocument();
    expect(screen.getByText("Jugador1")).toBeInTheDocument();
  });
});

const OK: EntriesActionState = { status: "done", message: "ok" };

describe("EntriesPanel reset", () => {
  it("offers to reset only once the bracket exists", () => {
    const { rerender } = renderWithToasts(
      <EntriesPanel entries={ENTRIES} hasBracket={false} actions={recordingActions(OK).actions} />,
    );

    expect(screen.queryByRole("button", { name: "Reiniciar torneo" })).not.toBeInTheDocument();

    rerender(<EntriesPanel entries={ENTRIES} hasBracket actions={recordingActions(OK).actions} />);

    expect(screen.getByRole("button", { name: "Reiniciar torneo" })).toBeInTheDocument();
    expect(screen.getByText(/No se puede deshacer/)).toBeInTheDocument();
  });

  it("sends the word the administrator typed", async () => {
    const { calls, actions } = recordingActions(OK);

    renderPanel({ entries: ENTRIES, hasBracket: true, actions });
    await userEvent.type(screen.getByLabelText("Escribe REINICIAR para confirmar"), "REINICIAR");
    await userEvent.click(screen.getByRole("button", { name: "Reiniciar torneo" }));

    await waitFor(() => expect(calls.reset).toHaveLength(1));
    expect(calls.reset[0].get("confirmation")).toBe("REINICIAR");
  });

  it("does not send an empty confirmation", async () => {
    const { calls, actions } = recordingActions(OK);

    renderPanel({ entries: ENTRIES, hasBracket: true, actions });
    await userEvent.click(screen.getByRole("button", { name: "Reiniciar torneo" }));

    expect(calls.reset).toHaveLength(0);
  });

  it("shows why the reset was refused", async () => {
    const { actions } = recordingActions({ status: "error", message: "Escribe REINICIAR tal cual para confirmar." });

    renderPanel({ entries: ENTRIES, hasBracket: true, actions });
    await userEvent.type(screen.getByLabelText("Escribe REINICIAR para confirmar"), "x");
    await userEvent.click(screen.getByRole("button", { name: "Reiniciar torneo" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Escribe REINICIAR tal cual para confirmar.");
  });
});

interface PanelOptions {
  entries: EntryView[];
  hasBracket: boolean;
  actions?: ReturnType<typeof recordingActions>["actions"];
}

function renderPanel({
  entries,
  hasBracket,
  actions = recordingActions({ status: "done", message: "ok" }).actions,
}: PanelOptions) {
  renderWithToasts(<EntriesPanel entries={entries} hasBracket={hasBracket} actions={actions} />);
}

function recordingActions(result: EntriesActionState, findByPin: PinLookup = async () => null) {
  const calls: Record<"add" | "checkIn" | "generate" | "reset", FormData[]> = {
    add: [],
    checkIn: [],
    generate: [],
    reset: [],
  };

  const record =
    (key: keyof typeof calls): EntriesAction =>
    async (_previous, form) => {
      calls[key].push(form);

      return result;
    };

  return {
    calls,
    actions: {
      add: record("add"),
      checkIn: record("checkIn"),
      generate: record("generate"),
      reset: record("reset"),
      findByPin,
    },
  };
}

function entry(index: number, channel: EntryView["channel"], status: EntryView["status"]): EntryView {
  return {
    id: `entry-${index}`,
    visitorId: `visitor-${index}`,
    gamertag: `Jugador${index}`,
    fullName: `Nombre Jugador${index}`,
    channel,
    status,
    checkedInAt: status === "checked_in" ? "2026-11-20T17:20:00.000Z" : null,
  };
}
