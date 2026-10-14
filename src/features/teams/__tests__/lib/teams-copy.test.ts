import { TEAMS_COPY } from "@features/teams/lib/teams-copy";

describe("TEAMS_COPY", () => {
  it("formats dynamic stand labels correctly", () => {
    expect(TEAMS_COPY.portal.stand("A1")).toBe("Stand A1");
    expect(TEAMS_COPY.portal.portalTeam("Pixel")).toBe("Portal · Pixel");
  });

  it("formats visits count correctly", () => {
    expect(TEAMS_COPY.overview.visitsCount(10)).toBe("10 visitas");
    expect(TEAMS_COPY.overview.manageMembers(3)).toBe("Gestionar Integrantes (3)");
  });

  it("formats scan alert descriptions correctly", () => {
    expect(TEAMS_COPY.scanner.alertSuccessDescription("alex")).toBe("Se sumó la visita del visitante: @alex");
    expect(TEAMS_COPY.scanner.alertSuccessDescription()).toBe("Visita registrada correctamente en este juego.");
    expect(TEAMS_COPY.scanner.alertDuplicateDescription("alex")).toBe(
      "El visitante @alex ya había probado este juego.",
    );
    expect(TEAMS_COPY.scanner.alertDuplicateDescription()).toBe("Este código QR ya fue escaneado en este stand.");
  });

  it("defines friendly copy for scanner key and game registration", () => {
    expect(TEAMS_COPY.overview.scannerKeyTitle).toBe("Llave de Escáner de tu Stand");
    expect(TEAMS_COPY.scannerKey.copyButton).toBe("Copiar llave");
    expect(TEAMS_COPY.gameManager.registerTitle).toBe("Registra el Videojuego de tu Equipo");
    expect(TEAMS_COPY.gameManager.registerSuccessToast).toBe("¡Videojuego registrado con éxito!");
  });
});
