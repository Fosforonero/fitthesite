import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AiLanding from "./page";

/**
 * SPRINT P0.24-B FASE A (22/09/2026): stesso difetto di home/press/famiglia
 * — TrustBadges forzava `locale={lc === "it" ? "it" : "en"}`, scartando le
 * traduzioni corrette gia' presenti nel componente per le altre 13 locale.
 */
describe("ai: TrustBadges usa la locale reale, non un fallback it/en forzato", () => {
  it("de: mostra la traduzione tedesca del titolo TrustBadges, non quella inglese", async () => {
    const html = renderToStaticMarkup(await AiLanding({ params: Promise.resolve({ locale: "de" }) }));
    expect(html).toContain("Mit Sorgfalt entwickelt");
    expect(html).not.toContain("Built with care");
  });

  it("es: mostra la traduzione spagnola del titolo TrustBadges, non quella inglese", async () => {
    const html = renderToStaticMarkup(await AiLanding({ params: Promise.resolve({ locale: "es" }) }));
    expect(html).toContain("Hecho con cuidado");
    expect(html).not.toContain("Built with care");
  });
});
