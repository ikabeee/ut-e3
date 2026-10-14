import { decodeSessionCookie } from "@features/auth/lib/server/auth-session";

describe("auth-session", () => {
  it("retorna null si la cookie está vacía o es indefinida", () => {
    expect(decodeSessionCookie(undefined)).toBeNull();
    expect(decodeSessionCookie("")).toBeNull();
  });

  it("retorna null si la firma de la cookie es inválida", () => {
    const fakeCookie = "eyJyb2xlIjoiYWRtaW4ifQ.invalid_signature";
    expect(decodeSessionCookie(fakeCookie)).toBeNull();
  });
});
