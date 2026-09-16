import { describe, it, expect } from "vitest";
import { FAMIGLIA_COMING_SOON, getFamigliaComingSoon } from "./famiglia-coming-soon";

describe("famiglia-coming-soon SSOT", () => {
  const locales = ["it", "es", "en"] as const;

  it("guarantees sub and metaDescription are identical across all locales (anti-divergence)", () => {
    for (const lc of locales) {
      const copy = FAMIGLIA_COMING_SOON[lc];
      expect(copy.metaDescription).toBe(copy.sub);
    }
  });

  it("contains zero em dashes across all copy entries", () => {
    for (const lc of locales) {
      const copy = FAMIGLIA_COMING_SOON[lc];
      const serialized = JSON.stringify(copy);
      expect(serialized).not.toContain("—");
    }
  });

  it("uses the approved neutral wording for shared view (no 'scelte dai membri' or 'selected')", () => {
    // IT: "alcune metriche" (not "scelte dai membri")
    expect(FAMIGLIA_COMING_SOON.it.why_items[0].body).toContain("alcune metriche");
    expect(FAMIGLIA_COMING_SOON.it.why_items[0].body).not.toContain("scelte dai membri");
    expect(FAMIGLIA_COMING_SOON.it.sub).toContain("alcune metriche");
    expect(FAMIGLIA_COMING_SOON.it.sub).not.toContain("scelte dai membri");

    // EN: "some group metrics" (not "selected group metrics")
    expect(FAMIGLIA_COMING_SOON.en.why_items[0].body).toContain("some group metrics");
    expect(FAMIGLIA_COMING_SOON.en.why_items[0].body).not.toContain("selected");
    expect(FAMIGLIA_COMING_SOON.en.sub).toContain("some group metrics");
    expect(FAMIGLIA_COMING_SOON.en.sub).not.toContain("selected");

    // ES: "algunas métricas del grupo"
    expect(FAMIGLIA_COMING_SOON.es.why_items[0].body).toContain("algunas métricas del grupo");
    expect(FAMIGLIA_COMING_SOON.es.sub).toContain("algunas métricas del grupo");
  });

  it("clarifies in FAQ 2 that feature is not available before describing current design", () => {
    // IT
    expect(FAMIGLIA_COMING_SOON.it.faqs[1].a).toMatch(/^Mesh Famiglia non è attualmente disponibile\./);
    expect(FAMIGLIA_COMING_SOON.it.faqs[1].a).toContain("Nel progetto attuale di Mesh Famiglia, la vista del gruppo non include la posizione geografica");
    expect(FAMIGLIA_COMING_SOON.it.faqs[1].a).toContain("Privacy Policy");

    // EN
    expect(FAMIGLIA_COMING_SOON.en.faqs[1].a).toMatch(/^Family Mesh is not currently available\./);
    expect(FAMIGLIA_COMING_SOON.en.faqs[1].a).toContain("In the current design of Family Mesh, the group view does not include other members' geographic location");
    expect(FAMIGLIA_COMING_SOON.en.faqs[1].a).toContain("Privacy Policy");

    // ES
    expect(FAMIGLIA_COMING_SOON.es.faqs[1].a).toMatch(/^Mesh Familia no está disponible actualmente\./);
    expect(FAMIGLIA_COMING_SOON.es.faqs[1].a).toContain("En el diseño actual de Mesh Familia, la vista de grupo no incluye la ubicación geográfica");
    expect(FAMIGLIA_COMING_SOON.es.faqs[1].a).toContain("Política de Privacidad");
  });

  it("contains no unsupported claims (no RLS, no 'tutto cifrato', no data broker claims)", () => {
    for (const lc of locales) {
      const copy = FAMIGLIA_COMING_SOON[lc];
      const serialized = JSON.stringify(copy).toLowerCase();
      expect(serialized).not.toContain("row-level security");
      expect(serialized).not.toContain("rls");
      expect(serialized).not.toContain("tutto cifrato");
      expect(serialized).not.toContain("everything is encrypted");
      expect(serialized).not.toContain("todo cifrado");
      expect(serialized).not.toContain("broker");
    }
  });

  it("correctly falls back to EN for other locales in helper", () => {
    expect(getFamigliaComingSoon("it")).toBe(FAMIGLIA_COMING_SOON.it);
    expect(getFamigliaComingSoon("es")).toBe(FAMIGLIA_COMING_SOON.es);
    expect(getFamigliaComingSoon("en")).toBe(FAMIGLIA_COMING_SOON.en);
    expect(getFamigliaComingSoon("de")).toBe(FAMIGLIA_COMING_SOON.en);
    expect(getFamigliaComingSoon("fr")).toBe(FAMIGLIA_COMING_SOON.en);
  });
});
