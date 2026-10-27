import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScheduleItemForm } from "@features/schedule/components/schedule-item-form";
import type { ScheduleFormState } from "@features/schedule/lib/schedule-actions";
import type { ScheduleItem } from "@features/schedule/lib/types";

const ZONES = [
  { id: "stage", label: "Escenario principal" },
  { id: "kof", label: "Torneo de KOF" },
];

const FINAL: ScheduleItem = {
  id: "final",
  title: "Gran final de KOF",
  description: "Los dos finalistas se enfrentan.",
  startsAt: "2026-11-20T22:05:00.000Z",
  endsAt: "2026-11-20T22:30:00.000Z",
  zone: "stage",
};

describe("ScheduleItemForm", () => {
  it("starts empty for a new item, with labeled fields and 'Sin zona' preselected", () => {
    render(<ScheduleItemForm zones={ZONES} action={async () => ({ status: "saved" })} />);

    expect(screen.getByLabelText("Título")).toHaveValue("");
    expect(screen.getByLabelText("Descripción")).toHaveValue("");
    expect(screen.getByLabelText("Inicio")).toHaveAttribute("type", "datetime-local");
    expect(screen.getByLabelText("Fin")).toHaveAttribute("type", "datetime-local");
    expect(screen.getByRole("button", { name: /Zona/ })).toHaveTextContent("Sin zona");
    expect(screen.getByRole("button", { name: "Agregar actividad" })).toBeInTheDocument();
  });

  it("fills an existing item with its Cancun times and sends its id", async () => {
    const received: FormData[] = [];

    const action = async (_previous: ScheduleFormState | null, form: FormData): Promise<ScheduleFormState> => {
      received.push(form);

      return { status: "saved" };
    };

    render(<ScheduleItemForm item={FINAL} zones={ZONES} action={action} />);

    expect(screen.getByLabelText("Título")).toHaveValue("Gran final de KOF");
    expect(screen.getByLabelText("Inicio")).toHaveValue("2026-11-20T17:05");
    expect(screen.getByLabelText("Fin")).toHaveValue("2026-11-20T17:30");
    expect(screen.getByRole("button", { name: /Zona/ })).toHaveTextContent("Escenario principal");

    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Cambios guardados.");
    expect(Object.fromEntries(received[0])).toMatchObject({
      id: "final",
      title: "Gran final de KOF",
      startsAt: "2026-11-20T17:05",
      zone: "stage",
    });
  });

  it("clears the fields after adding a new item, ready for the next one", async () => {
    render(<ScheduleItemForm zones={ZONES} action={async () => ({ status: "saved" })} />);
    await userEvent.type(screen.getByLabelText("Título"), "Mario Kart abierto");
    await userEvent.type(screen.getByLabelText("Descripción"), "Carreras libres.");
    await userEvent.type(screen.getByLabelText("Inicio"), "2026-11-20T13:30");
    await userEvent.type(screen.getByLabelText("Fin"), "2026-11-20T14:00");
    await userEvent.click(screen.getByRole("button", { name: "Agregar actividad" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Actividad agregada.");
    expect(screen.getByLabelText("Título")).toHaveValue("");
  });

  it("shows the message of each invalid field next to it", async () => {
    const action = async (): Promise<ScheduleFormState> => ({
      status: "invalid",
      errors: { title: "Escribe el título.", endsAt: "El fin no puede ser antes del inicio." },
    });

    render(<ScheduleItemForm item={FINAL} zones={ZONES} action={action} />);
    await userEvent.clear(screen.getByLabelText("Descripción"));
    await userEvent.type(screen.getByLabelText("Descripción"), "Texto que no debe perderse.");
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("Escribe el título.")).toBeInTheDocument();
    expect(screen.getByLabelText("Descripción")).toHaveValue("Texto que no debe perderse.");
    expect(screen.getByText("El fin no puede ser antes del inicio.")).toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toHaveAttribute("aria-invalid", "true");
  });
});
