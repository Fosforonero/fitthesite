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

  it("reconciles status to neutral evaluation with approved metadata titles (no coming soon, in arrivo, próximamente)", () => {
    expect(FAMIGLIA_COMING_SOON.it.metaTitle).toBe("Mesh Famiglia: progetto in valutazione | FitMesh Sync");
    expect(FAMIGLIA_COMING_SOON.en.metaTitle).toBe("Family Mesh: Project Under Evaluation | FitMesh Sync");
    expect(FAMIGLIA_COMING_SOON.es.metaTitle).toBe("Mesh Familia: proyecto en evaluación | FitMesh Sync");
  });

  it("hero sub matches approved neutral evaluation copy", () => {
    expect(FAMIGLIA_COMING_SOON.it.sub).toBe(
      "Mesh Famiglia non è attualmente disponibile. Stiamo valutando una vista di gruppo per alcune metriche. Nel progetto attuale, la vista non include la posizione geografica degli altri membri."
    );
    expect(FAMIGLIA_COMING_SOON.en.sub).toBe(
      "Family Mesh is not currently available. We are evaluating a group view for some metrics. In the current design, the view does not include other members' geographic location."
    );
    expect(FAMIGLIA_COMING_SOON.es.sub).toBe(
      "Mesh Familia no está disponible actualmente. Estamos evaluando una vista de grupo para algunas métricas. En el diseño actual, la vista no incluye la ubicación geográfica de los demás miembros."
    );
  });

  it("removes internal technical evidence and uses approved availability text (no feature flag mentions)", () => {
    expect(FAMIGLIA_COMING_SOON.it.availability_body).toBe(
      "Mesh Famiglia non è attualmente disponibile. Non è stata annunciata una data di rilascio."
    );
    expect(FAMIGLIA_COMING_SOON.es.availability_body).toBe(
      "Mesh Familia no está disponible actualmente. No se ha anunciado una fecha de lanzamiento."
    );
    expect(FAMIGLIA_COMING_SOON.en.availability_body).toBe(
      "Family Mesh is not currently available. No release date has been announced."
    );
  });

  it("removes generic HTTPS/TLS card from Famiglia page (exactly 2 why_items, no transport filler)", () => {
    for (const lc of locales) {
      const copy = FAMIGLIA_COMING_SOON[lc];
      expect(copy.why_items).toHaveLength(2);
      expect(copy.why_items[0].title).toBeTruthy();
      expect(copy.why_items[1].title).toBeTruthy();
    }
    // Why item 2 refers strictly to catalog
    expect(FAMIGLIA_COMING_SOON.it.why_items[1].body).toBe(
      "Le integrazioni attualmente disponibili sono documentate nel catalogo."
    );
    expect(FAMIGLIA_COMING_SOON.es.why_items[1].body).toBe(
      "Las integraciones actualmente disponibles están documentadas en el catálogo."
    );
    expect(FAMIGLIA_COMING_SOON.en.why_items[1].body).toBe(
      "Currently available integrations are documented in the catalog."
    );
  });

  it("strictly bounds FAQ 2 to the approved location statement (no GPS coordinates, no 'senza condividere')", () => {
    // IT FAQ 2
    expect(FAMIGLIA_COMING_SOON.it.faqs[1].q).toBe("Mesh Famiglia mostra la posizione degli altri membri?");
    expect(FAMIGLIA_COMING_SOON.it.faqs[1].a).toBe(
      "Mesh Famiglia non è attualmente disponibile. Nel progetto attuale, la vista del gruppo non include la posizione geografica degli altri membri."
    );

    // EN FAQ 2
    expect(FAMIGLIA_COMING_SOON.en.faqs[1].q).toBe("Does Family Mesh show the location of other members?");
    expect(FAMIGLIA_COMING_SOON.en.faqs[1].a).toBe(
      "Family Mesh is not currently available. In the current design, the group view does not include other members' geographic location."
    );

    // ES FAQ 2
    expect(FAMIGLIA_COMING_SOON.es.faqs[1].q).toBe("¿Mesh Familia muestra la ubicación de los demás miembros?");
    expect(FAMIGLIA_COMING_SOON.es.faqs[1].a).toBe(
      "Mesh Familia no está disponible actualmente. En el diseño actual, la vista del grupo no incluye la ubicación geográfica de los demás miembros."
    );
  });

  it("bounds FAQ 3 to neutral catalog reference with zero future predictions", () => {
    // IT FAQ 3
    expect(FAMIGLIA_COMING_SOON.it.faqs[2].q).toBe("Quali dispositivi sono supportati?");
    expect(FAMIGLIA_COMING_SOON.it.faqs[2].a).toBe("Le integrazioni attualmente disponibili sono documentate nel catalogo.");

    // EN FAQ 3
    expect(FAMIGLIA_COMING_SOON.en.faqs[2].q).toBe("Which devices are supported?");
    expect(FAMIGLIA_COMING_SOON.en.faqs[2].a).toBe("Currently available integrations are documented in the catalog.");

    // ES FAQ 3
    expect(FAMIGLIA_COMING_SOON.es.faqs[2].q).toBe("¿Qué dispositivos son compatibles?");
    expect(FAMIGLIA_COMING_SOON.es.faqs[2].a).toBe("Las integraciones actualmente disponibles están documentadas en el catálogo.");
  });

  it("enforces stringent negative assertion suite across all locales", () => {
    const FORBIDDEN_SUBSTRINGS = [
      "coming soon",
      "in arrivo",
      "próximamente",
      "proximamente",
      "feature flag",
      "coordinate gps",
      "gps coordinates",
      "coordenadas gps",
      "gps",
      "senza condividere la posizione",
      "senza condividere",
      "without sharing",
      "sin compartir",
      "al momento del rilascio",
      "al momento dell'eventuale rilascio",
      "at the time of",
      "en el momento del",
      "dipenderà dalle integrazioni",
      "will depend on",
      "dependerá de",
      "https/tls",
      "tls",
      "cifrat",
      "encrypt",
      "row-level security",
      "rls",
      "broker",
      "—",
    ];

    for (const lc of locales) {
      const serialized = JSON.stringify(FAMIGLIA_COMING_SOON[lc]).toLowerCase();
      for (const forbidden of FORBIDDEN_SUBSTRINGS) {
        expect(serialized, `Locale ${lc} must not contain '${forbidden}'`).not.toContain(forbidden);
      }
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
