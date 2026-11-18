import { isValidElement, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { ActivateForm } from "@features/accounts/components/activate-form";
import { ResetView } from "@features/accounts/pages/reset-password-page";

describe("ResetView", () => {
  it("passes the client form only plain data besides the Server Action", () => {
    const view = ResetView({ state: { status: "valid", name: "Ana" }, token: "the-token" });
    const [form] = findElements(view, ActivateForm);

    const { action, ...data } = form.props;

    expect(action).toBeInstanceOf(Function);
    expect(JSON.parse(JSON.stringify(data))).toEqual(data);
    expect(data).toEqual({ token: "the-token", variant: "resetPassword" });
  });
});

function findElements(node: ReactNode, type: typeof ActivateForm): ReactElement<ComponentProps<typeof ActivateForm>>[] {
  if (Array.isArray(node)) return node.flatMap((child) => findElements(child, type));

  if (!isValidElement<{ children?: ReactNode }>(node)) return [];

  // SAFETY: the type is compared with ActivateForm on the line itself.
  const own = node.type === type ? [node as ReactElement<ComponentProps<typeof ActivateForm>>] : [];

  return [...own, ...findElements(node.props.children, type)];
}
