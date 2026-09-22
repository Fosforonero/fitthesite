import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { locales } from "@/lib/i18n";
import { CAPABILITY_STATUS } from "@/lib/product-facts";
import FamigliaLanding, { generateMetadata } from "./page";

/**
 * SPRINT P0.24-B FASE A (22/09/2026): non basta che i test leggano
 * `getFamigliaComingSoon()` (gia' coperto da lib/content/famiglia-ssot.test.ts
 * e lib/llms-txt.test.ts). Questo test renderizza la PAGINA vera, con
 * `renderToStaticMarkup`, come gia' fatto per legal-dates-parity.test.tsx
 * (micro-gate P0.24-A-A): controlla che il testo visibile, i metadata e il
 * JSON-LD (WebPage + FAQPage) generati dicano tutti la stessa cosa, nelle 15
 * lingue, non solo nei due o tre locale controllati a mano finora.
 */
describe("famiglia: HTML e JSON-LD renderizzati dicono 'in sviluppo', non 'in valutazione'", () => {
  it("CAPABILITY_STATUS.familyMesh non e' su uno stato live (precondizione dei controlli sotto)", () => {
    expect(["live_verified", "live_limited", "release_candidate"]).not.toContain(
      CAPABILITY_STATUS.familyMesh?.status,
    );
  });

  for (const locale of locales as readonly string[]) {
    it(`${locale}: pagina renderizzata coerente`, async () => {
      const html = renderToStaticMarkup(await FamigliaLanding({ params: Promise.resolve({ locale }) }));
      const meta = await generateMetadata({ params: Promise.resolve({ locale }) });

      const forbidden = /under evaluation|in valutazione|en evaluaci[oó]n|en évaluation|in prüfung|em avaliação|w trakcie oceny|değerlendirme aşamasında|coming soon|in arrivo|próximamente|kommer snart/i;
      expect(html, "HTML renderizzato contiene una formula superata").not.toMatch(forbidden);
      expect(String(meta.title), "metaTitle contiene una formula superata").not.toMatch(forbidden);
      expect(String(meta.description), "metaDescription contiene una formula superata").not.toMatch(forbidden);

      const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(
        (m) => JSON.parse(m[1]) as Record<string, unknown>,
      );
      const webPage = jsonLdBlocks.find((b) => b["@type"] === "WebPage");
      const faqPage = jsonLdBlocks.find((b) => b["@type"] === "FAQPage");
      expect(webPage, "nessun nodo WebPage nel JSON-LD renderizzato").toBeDefined();
      expect(faqPage, "nessun nodo FAQPage nel JSON-LD renderizzato").toBeDefined();

      const webPageText = JSON.stringify(webPage);
      const faqPageText = JSON.stringify(faqPage);
      expect(webPageText, "WebPage JSON-LD contiene una formula superata").not.toMatch(forbidden);
      expect(faqPageText, "FAQPage JSON-LD contiene una formula superata").not.toMatch(forbidden);

      // Nessuna superficie descrive gruppi, condivisione, controlli privacy attivi
      // o inclusione in Pro come gia' definiti (istruzione esplicita di Matteo,
      // 22/09/2026): nessun dettaglio di funzionamento verificabile oggi.
      for (const forbiddenMechanic of [/mesh-xxxx/i, /8 membri|8 members/i, /€3[.,]99|€4[.,]99/, /14[- ]day.*trial.*mesh|prova.*mesh/i]) {
        expect(html, `dettaglio di funzionamento non verificato nel body: ${forbiddenMechanic}`).not.toMatch(
          forbiddenMechanic,
        );
      }
    });
  }
});

/**
 * SPRINT P0.24-B FASE A (22/09/2026): il link CTA secondario ("Scarica
 * l'app per le funzioni attive") restava su un ternario a 3 rami
 * (it/es/altrimenti-inglese) scritto prima della migrazione a
 * getFamigliaComingSoon(): per de/fr/pt/pl/tr — locale gia' tradotte e
 * indicizzate sul resto della pagina — l'utente vedeva questo unico link in
 * inglese in mezzo a testo tradotto. Verifica diretta sul rendering.
 */
describe("famiglia: link CTA secondario tradotto per tutte le locale gia' coperte da getFamigliaComingSoon", () => {
  // Sottostringhe senza apostrofo: renderToStaticMarkup esegue l'escape HTML
  // di JSX text content (l' → l&#x27;), quindi un confronto con l'apostrofo
  // letterale fallirebbe per un motivo di rendering, non di traduzione.
  const EXPECTED: Record<string, string> = {
    it: "per le funzioni attive",
    es: "Descarga la app para las funciones activas",
    de: "App für aktive Funktionen herunterladen",
    fr: "pour les fonctionnalités actives",
    pt: "Baixar o app para as funcionalidades ativas",
    pl: "Pobierz aplikację z aktywnymi funkcjami",
    tr: "Aktif özellikler için uygulamayı indirin",
  };

  for (const [locale, expected] of Object.entries(EXPECTED)) {
    it(`${locale}: mostra il link tradotto, non il fallback inglese`, async () => {
      const html = renderToStaticMarkup(await FamigliaLanding({ params: Promise.resolve({ locale }) }));
      expect(html, `${locale}: link CTA secondario non tradotto`).toContain(expected);
      if (locale !== "it") {
        expect(html, `${locale}: mostra ancora il fallback inglese invece della traduzione`).not.toContain(
          "Download the app for active features",
        );
      }
    });
  }
});

/**
 * TrustBadges.tsx ha traduzioni corrette per tutte le 15 locale, ma i due
 * call-site su /famiglia forzavano `locale={lc === "it" ? "it" : "en"}`.
 * Nessuno dei due e' verificabile via rendering: il primo (riga ~1290) e'
 * nel ramo "pieno" morto dietro COMING_SOON=true (mai raggiunto da
 * FamigliaLanding()); il secondo (riga ~1413, dentro ComingSoonState, il
 * ramo davvero renderizzato) usa `variant="compact"`, che secondo
 * components/TrustBadges.tsx mostra SOLO `madeIn`/`indie` (identici in
 * tutte le locale per scelta di branding) e non il campo `title` che varia
 * per locale — quindi il fix e' corretto ma il suo effetto non e' osservabile
 * nel testo renderizzato con la copy attuale. Verifica quindi sulla sorgente,
 * non sul rendering.
 */
describe("famiglia: TrustBadges non forza piu' un fallback it/en", () => {
  it("nessun call-site passa ancora locale={lc === \"it\" ? \"it\" : \"en\"}", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const source = fs.readFileSync(path.join(process.cwd(), "app/(frontend)/[locale]/(marketing)/famiglia/page.tsx"), "utf8");
    expect(source).not.toMatch(/TrustBadges locale=\{lc === "it" \? "it" : "en"\}/);
  });
});
