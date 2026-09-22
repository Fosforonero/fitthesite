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
