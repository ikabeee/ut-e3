import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ScheduleItemDelete } from "@features/schedule/components/schedule-item-delete";
import type { ScheduleFormState } from "@features/schedule/lib/schedule-actions";

describe("ScheduleItemDelete", () => {
  it("asks for confirmation before sending the id of the item to delete", async () => {
    const { received, action } = recordingAction();

    render(<ScheduleItemDelete itemId="final" itemTitle="Gran final de KOF" action={action} />);
    await userEvent.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(received).toHaveLength(0);
    expect(screen.getByText("¿Eliminar «Gran final de KOF»? No se puede deshacer.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Sí, eliminar" }));

    expect(received.map((form) => form.get("id"))).toEqual(["final"]);
  });

  it("lets the sysadmin back out without deleting", async () => {
    const { received, action } = recordingAction();

    render(<ScheduleItemDelete itemId="final" itemTitle="Gran final de KOF" action={action} />);
    await userEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(received).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Eliminar" })).toBeInTheDocument();
  });
});

function recordingAction() {
  const received: FormData[] = [];

  const action = async (_previous: ScheduleFormState | null, form: FormData): Promise<ScheduleFormState> => {
    received.push(form);

    return { status: "deleted" };
  };

  return { received, action };
}
