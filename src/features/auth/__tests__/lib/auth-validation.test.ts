import { parseConfirmPasswordInput, parseLoginInput, parseRegisterTeamInput } from "@features/auth/lib/auth-validation";

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
    it("valida un registro de equipo completo sin contraseña", () => {
      const res = parseRegisterTeamInput({
        teamName: "  Equipo Fénix  ",
        fullName: "  Carlos Gómez  ",
        email: "  cgomez@ute3.edu.mx  ",
        groupName: "IDYGS101",
      });

      expect(res).toEqual({
        teamName: "Equipo Fénix",
        fullName: "Carlos Gómez",
        email: "cgomez@ute3.edu.mx",
        groupName: "IDYGS101",
      });
    });

    it("valida un registro de equipo con contraseña opcional", () => {
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

    it("rechaza contraseñas con menos de 8 caracteres si se proporcionan", () => {
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
          groupName: "INVALID_GROUP",
        }),
      ).toThrow();
    });
  });

  describe("parseConfirmPasswordInput", () => {
    it("valida token y contraseñas que coinciden", () => {
      const res = parseConfirmPasswordInput({
        token: "1234567890abcdef1234567890abcdef",
        password: "mysecurepassword",
        confirmPassword: "mysecurepassword",
      });

      expect(res).toEqual({
        token: "1234567890abcdef1234567890abcdef",
        password: "mysecurepassword",
        confirmPassword: "mysecurepassword",
      });
    });

    it("falla si la contraseña tiene menos de 8 caracteres", () => {
      expect(() =>
        parseConfirmPasswordInput({
          token: "1234567890abcdef1234567890abcdef",
          password: "short",
          confirmPassword: "short",
        }),
      ).toThrow();
    });

    it("falla si las contraseñas no coinciden", () => {
      expect(() =>
        parseConfirmPasswordInput({
          token: "1234567890abcdef1234567890abcdef",
          password: "mysecurepassword1",
          confirmPassword: "mysecurepassword2",
        }),
      ).toThrow();
    });
  });
});
