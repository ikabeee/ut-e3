import { parseLoginInput, parseRegisterTeamInput } from "@features/auth/lib/auth-validation";

describe("auth-validation", () => {
  describe("parseLoginInput", () => {
    it("valida y retorna los datos limpios", () => {
      const res = parseLoginInput({
        identifier: "  admin@ute3.edu.mx  ",
        password: "secretpassword",
      });

      expect(res).toEqual({
        identifier: "admin@ute3.edu.mx",
        password: "secretpassword",
      });
    });

    it("falla si faltan campos obligatorios", () => {
      expect(() => parseLoginInput({ identifier: "", password: "" })).toThrow();
    });
  });

  describe("parseRegisterTeamInput", () => {
    it("valida un registro de equipo completo", () => {
      const res = parseRegisterTeamInput({
        teamName: "  Equipo Fénix  ",
        fullName: "  Carlos Gómez  ",
        email: "  cgomez@ute3.edu.mx  ",
        password: "securepassword123",
        groupName: "IDYGS101",
      });

      expect(res).toEqual({
        teamName: "Equipo Fénix",
        fullName: "Carlos Gómez",
        email: "cgomez@ute3.edu.mx",
        password: "securepassword123",
        groupName: "IDYGS101",
      });
    });

    it("rechaza contraseñas con menos de 8 caracteres", () => {
      expect(() =>
        parseRegisterTeamInput({
          teamName: "Equipo Fénix",
          fullName: "Carlos Gómez",
          email: "cgomez@ute3.edu.mx",
          password: "short",
          groupName: "IDYGS101",
        }),
      ).toThrow();
    });

    it("rechaza correos con formato inválido", () => {
      expect(() =>
        parseRegisterTeamInput({
          teamName: "Equipo Fénix",
          fullName: "Carlos Gómez",
          email: "not-an-email",
          password: "securepassword123",
          groupName: "IDYGS101",
        }),
      ).toThrow();
    });

    it("rechaza grupos no válidos", () => {
      expect(() =>
        parseRegisterTeamInput({
          teamName: "Equipo Fénix",
          fullName: "Carlos Gómez",
          email: "cgomez@ute3.edu.mx",
          password: "securepassword123",
          groupName: "INVALID_GROUP",
        }),
      ).toThrow();
    });
  });
});
