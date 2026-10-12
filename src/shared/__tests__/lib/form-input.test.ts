import { formDataToInput } from "@shared/lib/form-input";

describe("formDataToInput", () => {
  it("keeps single fields as text and repeated fields as a list", () => {
    const formData = new FormData();
    formData.append("name", "Ruta 9");
    formData.append("platformIds", "a");
    formData.append("platformIds", "b");
    formData.append("cover", new Blob(["x"]), "cover.png");

    expect(formDataToInput(formData)).toEqual({ name: "Ruta 9", platformIds: ["a", "b"], cover: "" });
  });
});
