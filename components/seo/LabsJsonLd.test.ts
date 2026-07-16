import { describe, expect, it } from "vitest";

import { labsToolJsonLdGraph } from "./LabsJsonLd";
import { organizationCompactRef } from "./OrganizationJsonLd";
import { authorCompactNode } from "@/lib/seo/entities";
import { SITE_URL } from "@/lib/product-facts";

/**
 * Verifica strutturale del graph JSON-LD Labs (Sprint P1.0A, Fase 7):
 * isPartOf deve referenziare #website (l'entita WebSite emessa nel layout),
 * non #organization, cosi il WebPage risulta parte del sito, non
 * dell'organizzazione. publisher/author restano riferimenti compatti
 * autosufficienti (mai un bare {"@id": ...}), mainEntity punta al
 * WebApplication definito nello stesso graph.
 */
const INPUT = {
  locale: "it" as const,
  path: "/it/labs/calcolatore-hrv-rmssd",
  pageTitle: "Calcolatore HRV: RMSSD e analisi intervalli RR",
  pageDescription: "Calcola RMSSD e deviazione standard da intervalli RR/IBI.",
  toolName: "Calcolatore HRV (RMSSD)",
  toolDescription: "Calcola RMSSD e deviazione standard da intervalli RR/IBI.",
  datePublished: "2026-07-16",
  dateModified: "2026-07-16",
  breadcrumb: [
    { name: "FitMesh Sync", path: "/it" },
    { name: "FitMesh Labs", path: "/it/labs" },
    { name: "Calcolatore HRV", path: "/it/labs/calcolatore-hrv-rmssd" },
  ],
  faq: [{ question: "Domanda?", answer: "Risposta." }],
  ogImagePath: "/it/labs/calcolatore-hrv-rmssd/opengraph-image",
};

describe("labsToolJsonLdGraph — riferimenti strutturali", () => {
  const graph = labsToolJsonLdGraph(INPUT)["@graph"];
  const webPage = graph.find((n) => n["@type"] === "WebPage") as any;
  const webApplication = graph.find((n) => n["@type"] === "WebApplication") as any;

  it("WebPage.isPartOf punta a #website, non a #organization", () => {
    expect(webPage.isPartOf).toEqual({ "@id": `${SITE_URL}#website` });
  });

  it("WebPage.publisher e un riferimento compatto autosufficiente all'organizzazione", () => {
    expect(webPage.publisher).toEqual(organizationCompactRef());
    expect(webPage.publisher["@id"]).toBe(`${SITE_URL}#organization`);
  });

  it("WebPage.author e l'entita autore canonica compatta", () => {
    expect(webPage.author).toEqual(authorCompactNode());
  });

  it("WebPage.mainEntity punta al WebApplication dello stesso graph", () => {
    expect(webPage.mainEntity).toEqual({ "@id": webApplication["@id"] });
    expect(webApplication["@id"]).toBe(`${SITE_URL}${INPUT.path}#webapplication`);
  });

  it("WebApplication.publisher/author usano gli stessi riferimenti compatti del WebPage", () => {
    expect(webApplication.publisher).toEqual(organizationCompactRef());
    expect(webApplication.author).toEqual(authorCompactNode());
  });

  it("nessun riferimento e un bare {\"@id\": ...} senza altri campi risolvibili altrove nello stesso graph o via componenti condivisi", () => {
    for (const ref of [webPage.publisher, webPage.author, webApplication.publisher, webApplication.author]) {
      expect(Object.keys(ref).length).toBeGreaterThan(1);
    }
  });
});
