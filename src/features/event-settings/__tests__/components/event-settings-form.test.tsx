import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventSettingsForm, type EventSettingsAction } from "@features/event-settings/components/event-settings-form";
import type { EditableEventSettings } from "@features/event-settings/lib/event-settings-input";

const SETTINGS: EditableEventSettings = {
  eventStartsAt: "2026-11-20T17:00:00.000Z",
  eventEndsAt: "2026-11-20T23:30:00.000Z",
  registrationOpensAt: "2026-11-13T05:00:00.000Z",
  kofRegistrationOpensAt: "2026-11-13T05:00:00.000Z",
  kofCheckInStartsAt: "2026-11-20T17:00:00.000Z",
  kofCheckInEndsAt: "2026-11-20T17:45:00.000Z",
  kofOnsiteSignupStartsAt: "2026-11-20T17:00:00.000Z",
  kofOnsiteSignupEndsAt: "2026-11-20T17:45:00.000Z",
  kofBracketGeneratesAt: "2026-11-20T17:55:00.000Z",
  marketplaceClosesAt: "2026-11-11T04:59:00.000Z",
  itchOpensAt: "2026-11-20T21:30:00.000Z",
  checkInCutoffAt: "2026-11-20T21:50:00.000Z",
  raffleStartsAt: "2026-11-20T21:40:00.000Z",
  marketplaceFormUrl: null,
  fraudTopScoreCount: 12,
  fraudWindowMinutes: 10,
  fraudSingleVisitMax: 1,
};

const CUTOFF_ERROR = "El corte de check-ins debe ser antes del inicio de la rifa.";

const SUMMARY = "Revisa los campos marcados.";

const REFUSED: EventSettingsAction = async () => ({
  status: "error",
  message: SUMMARY,
  errors: { raffleStartsAt: CUTOFF_ERROR },
});

describe("EventSettingsForm errors", () => {
  it("shows the error of the pair and the summary after a refused save", async () => {
    renderForm(REFUSED);

    await save();

    expect(await screen.findByText(CUTOFF_ERROR)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(SUMMARY);
  });

  it("clears the error and the summary when the visitor edits the field of the pair that is not marked", async () => {
    renderForm(REFUSED);
    await save();
    await screen.findByText(CUTOFF_ERROR);

    await userEvent.type(screen.getByLabelText("Corte de check-ins"), "1");

    expect(screen.queryByText(CUTOFF_ERROR)).not.toBeInTheDocument();
    expect(screen.queryByText(SUMMARY)).not.toBeInTheDocument();
  });

  it("keeps the error while the visitor edits an unrelated field", async () => {
    renderForm(REFUSED);
    await save();
    await screen.findByText(CUTOFF_ERROR);

    await userEvent.type(screen.getByLabelText("Calificaciones de 5 que disparan la alerta"), "1");

    expect(screen.getByText(CUTOFF_ERROR)).toBeInTheDocument();
    expect(screen.getByText(SUMMARY)).toBeInTheDocument();
  });

  it("brings the error back if the next save is refused again", async () => {
    renderForm(REFUSED);
    await save();
    await screen.findByText(CUTOFF_ERROR);
    await editCutoff("2026-11-20T15:50");
    await save();

    expect(await screen.findByText(CUTOFF_ERROR)).toBeInTheDocument();
    expect(screen.getByText(SUMMARY)).toBeInTheDocument();
  });

  it("clears the message of a save that was refused without a field", async () => {
    renderForm(async () => ({ status: "error", message: "No se pudo guardar." }));
    await save();
    await screen.findByText("No se pudo guardar.");

    await userEvent.type(screen.getByLabelText("Corte de check-ins"), "1");

    expect(screen.queryByText("No se pudo guardar.")).not.toBeInTheDocument();
  });
});

function renderForm(action: EventSettingsAction) {
  return render(<EventSettingsForm settings={SETTINGS} action={action} />);
}

// A whole valid value: the field is required, so a half-typed one would stop the next save before it is sent.
async function editCutoff(value: string) {
  const field = screen.getByLabelText("Corte de check-ins");

  await userEvent.clear(field);
  await userEvent.type(field, value);
}

async function save() {
  await userEvent.click(screen.getByRole("button", { name: "Guardar valores" }));
}
