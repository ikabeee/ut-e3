import { Toast, toast } from "@heroui/react";
import { act, render, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";

// The site mounts one toast region in the root layout; a component test mounts its own next to what it renders, so the
// toasts it raises can be read with `getByRole("alert")`. The queue is global: it starts empty in every test.
export function renderWithToasts(ui: ReactElement): RenderResult {
  toast.clear();

  const result = render(ui);

  render(<Toast.Provider />);

  return result;
}

// Every test file that renders with toasts empties the queue after each test: a closed toast stays mounted for its
// exit animation (300 ms) and would show up in the region of the next test.
afterEach(clearToasts);

async function clearToasts(): Promise<void> {
  await act(async () => {
    toast.clear();
    await new Promise((resolve) => setTimeout(resolve, 350));
  });
}
