import { describe, it, expect } from "vitest";
import { FAMIGLIA_COMING_SOON, getFamigliaComingSoon } from "./famiglia-coming-soon";

describe("famiglia-coming-soon SSOT", () => {
  const locales = ["it", "es", "en", "de", "pt", "fr", "pl", "tr"] as const;

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

  // SPRINT P0.24-B FASE A (22/09/2026): decisione di prodotto confermata da
  // Matteo. Mesh Famiglia e' decisa ed e' in sviluppo (non piu' "in
  // valutazione", che sottostimava: la decisione e' presa), non ancora
  // disponibile, nessuna data di rilascio annunciata. Formula pubblica
  // autorizzata, verbatim. Vedi CAPABILITY_STATUS.familyMesh in
  // lib/product-facts.ts per l'ancora di prodotto.
  it("reconciles status to 'in development' with approved metadata titles (no coming soon, in arrivo, próximamente, under evaluation)", () => {
    expect(FAMIGLIA_COMING_SOON.it.metaTitle).toBe("Mesh Famiglia: in sviluppo | FitMesh Sync");
    expect(FAMIGLIA_COMING_SOON.en.metaTitle).toBe("Family Mesh: In Development | FitMesh Sync");
    expect(FAMIGLIA_COMING_SOON.es.metaTitle).toBe("Mesh Familia: en desarrollo | FitMesh Sync");
  });

  it("hero sub matches the approved 'in development' formula", () => {
    expect(FAMIGLIA_COMING_SOON.it.sub).toBe(
      "Mesh Famiglia è in sviluppo e non è ancora disponibile. Non abbiamo annunciato una data di rilascio."
    );
    expect(FAMIGLIA_COMING_SOON.en.sub).toBe(
      "Family Mesh is in development and is not yet available. We haven't announced a release date."
    );
    expect(FAMIGLIA_COMING_SOON.es.sub).toBe(
      "Mesh Familia está en desarrollo y todavía no está disponible. No hemos anunciado una fecha de lanzamiento."
    );
  });

  it("uses the approved 'in development' availability text (no feature flag mentions)", () => {
    expect(FAMIGLIA_COMING_SOON.it.availability_body).toBe(
      "Mesh Famiglia è in sviluppo e non è ancora disponibile. Non abbiamo annunciato una data di rilascio."
    );
    expect(FAMIGLIA_COMING_SOON.es.availability_body).toBe(
      "Mesh Familia está en desarrollo y todavía no está disponible. No hemos anunciado una fecha de lanzamiento."
    );
    expect(FAMIGLIA_COMING_SOON.en.availability_body).toBe(
      "Family Mesh is in development and is not yet available. We haven't announced a release date."
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

  // FASE A (22/09/2026): la FAQ 2 descriveva un dettaglio di comportamento
  // (nessuna posizione geografica condivisa) per una funzione in sviluppo,
  // in contrasto con l'istruzione esplicita di Matteo di non descrivere
  // meccaniche non ancora verificate. Sostituita con un rimando allo stato
  // aggiornato, senza alcun dettaglio di funzionamento.
  it("bounds FAQ 2 to a status pointer, no feature mechanics (no GPS coordinates, no location claim)", () => {
    // IT FAQ 2
    expect(FAMIGLIA_COMING_SOON.it.faqs[1].q).toBe("Dove trovo lo stato più aggiornato di Mesh Famiglia?");
    expect(FAMIGLIA_COMING_SOON.it.faqs[1].a).toBe("Su questa pagina, sempre aggiornata.");

    // EN FAQ 2
    expect(FAMIGLIA_COMING_SOON.en.faqs[1].q).toBe("Where can I find the latest status of Family Mesh?");
    expect(FAMIGLIA_COMING_SOON.en.faqs[1].a).toBe("On this page, always kept up to date.");

    // ES FAQ 2
    expect(FAMIGLIA_COMING_SOON.es.faqs[1].q).toBe("¿Dónde encuentro el estado más reciente de Mesh Familia?");
    expect(FAMIGLIA_COMING_SOON.es.faqs[1].a).toBe("En esta página, siempre actualizada.");
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
      // FASE A (22/09/2026): "in evaluation"/"in valutazione" sottostima ora
      // che la decisione e' presa (Matteo, 22/09/2026); mai reintrodurla.
      "under evaluation",
      "in valutazione",
      "en evaluación",
      "en évaluation",
      "in prüfung",
      "em avaliação",
      "w trakcie oceny",
      "değerlendirme aşamasında",
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
    expect(getFamigliaComingSoon("de")).toBe(FAMIGLIA_COMING_SOON.de);
    expect(getFamigliaComingSoon("fr")).toBe(FAMIGLIA_COMING_SOON.fr);
    expect(getFamigliaComingSoon("pt")).toBe(FAMIGLIA_COMING_SOON.pt);
    expect(getFamigliaComingSoon("pl")).toBe(FAMIGLIA_COMING_SOON.pl);
    expect(getFamigliaComingSoon("tr")).toBe(FAMIGLIA_COMING_SOON.tr);
    expect(getFamigliaComingSoon("ja")).toBe(FAMIGLIA_COMING_SOON.en);
    expect(getFamigliaComingSoon("ko")).toBe(FAMIGLIA_COMING_SOON.en);
  });
});
