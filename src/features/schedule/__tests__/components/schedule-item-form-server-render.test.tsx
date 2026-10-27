/**
 * @jest-environment node
 */
import { renderToString } from "react-dom/server";
import { ScheduleItemForm } from "@features/schedule/components/schedule-item-form";

describe("ScheduleItemForm before hydration", () => {
  it("hands the submit to React or the Server Action instead of sending the fields in the URL", () => {
    const html = renderToString(<ScheduleItemForm zones={[]} action={async () => ({ status: "saved" })} />);

    // Without an action attribute the browser would submit a GET with every field in the query string.
    expect(html).toMatch(/<form[^>]*\saction="/);
    expect(html).not.toMatch(/<form[^>]*method="get"/i);
  });
});
