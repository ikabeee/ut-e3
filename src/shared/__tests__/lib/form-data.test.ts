import { readFormText } from "@shared/lib/form-data";

describe("readFormText", () => {
  it("reads a text field and gives an empty string for a missing one or a file", () => {
    const form = new FormData();

    form.set("email", "ana@ut.mx");
    form.set("photo", new File(["x"], "photo.png"));

    expect(readFormText(form, "email")).toBe("ana@ut.mx");
    expect(readFormText(form, "photo")).toBe("");
    expect(readFormText(form, "name")).toBe("");
  });

  it.each([[2], [[1, 2, 3]], [{ a: 1 }], [undefined]])(
    "reads every field of a Server Action body that is not FormData (%p) as empty",
    (body) => {
      expect(readFormText(body, "email")).toBe("");
    },
  );
});
