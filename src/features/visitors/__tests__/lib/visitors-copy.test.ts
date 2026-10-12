import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";

describe("VISITORS_COPY", () => {
  it("says how many games are missing in singular and plural", () => {
    expect(VISITORS_COPY.raffle.locked(1)).toBe("Te falta 1 juego por probar para obtener tu boleto del sorteo.");
    expect(VISITORS_COPY.raffle.notYet(3)).toBe("Te faltan 3 juegos por probar para obtener tu boleto.");
  });

  it("summarizes the traffic of a stand", () => {
    expect(VISITORS_COPY.traffic.summary("high", 12, 15)).toBe("Mucha afluencia · 12 en 15 min");
  });
});
