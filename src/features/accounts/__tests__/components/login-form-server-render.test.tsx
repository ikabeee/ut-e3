/**
 * @jest-environment node
 */
import { renderToString } from "react-dom/server";
import { LoginForm } from "@features/accounts/components/login-form";

describe("LoginForm before hydration", () => {
  it("hands the submit to React or the Server Action, so the password never travels in the URL", () => {
    const html = renderToString(<LoginForm action={async () => ({ error: "" })} />);

    // Without an action attribute the browser would submit a GET with every field in the query string.
    expect(html).toMatch(/<form[^>]*\saction="/);
    expect(html).not.toMatch(/<form[^>]*method="get"/i);
  });
});
