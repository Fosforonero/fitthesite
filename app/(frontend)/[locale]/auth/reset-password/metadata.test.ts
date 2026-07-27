import { describe, expect, it, vi } from "vitest";

// Confrontare contro la homepage reale (sotto) trascina l'import di
// ../../layout -> RootHtmlShell -> lib/fonts.ts, che chiama next/font/google
// a module scope: quella chiamata richiede la trasformazione SWC di Next in
// build, assente sotto Vitest ("(0 , Inter) is not a function" altrimenti).
// Mock scoped a QUESTO file soltanto (non vitest.setup.ts condiviso): non
// serve al test ne' al codice reale, solo a rendere l'import sicuro qui.
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter" }),
  Space_Grotesk: () => ({ variable: "--font-grotesk" }),
}));

import { generateMetadata } from "./page";
import { generateMetadata as generateHomepageMetadata } from "../../layout";
import { RESET_PASSWORD_LOCALES, TRANSLATIONS } from "./translations";

/**
 * Guardia strutturale contro la regressione chiusa in questo sprint: le 11
 * pagine reset-password ereditavano title/description/canonical/OG/Twitter
 * dal layout [locale], cioe' quelli della HOMEPAGE. Confronta l'output REALE
 * di generateMetadata() della recovery contro l'output REALE di
 * generateMetadata() della homepage per la stessa locale (stesso modulo,
 * import diretto) — non un pattern indovinato, cosi' se in futuro la
 * homepage cambiasse titolo il test resta valido senza doverlo aggiornare a
 * mano.
 */
describe("reset-password generateMetadata — no homepage leakage, social parity", () => {
  it.each(RESET_PASSWORD_LOCALES)("locale '%s': never equals the homepage's metadata", async (locale) => {
    const params = Promise.resolve({ locale });
    const recovery = await generateMetadata({ params });
    const homepage = await generateHomepageMetadata({ params });

    expect(recovery.title).not.toBe(homepage.title);
    expect(recovery.description).not.toBe(homepage.description);
    expect((recovery.alternates as { canonical?: string })?.canonical).not.toBe(
      (homepage.alternates as { canonical?: string })?.canonical,
    );
    expect((recovery.openGraph as { title?: string })?.title).not.toBe(
      (homepage.openGraph as { title?: string })?.title,
    );
    expect((recovery.openGraph as { description?: string })?.description).not.toBe(
      (homepage.openGraph as { description?: string })?.description,
    );
    expect((recovery.openGraph as { url?: string })?.url).not.toBe(
      (homepage.openGraph as { url?: string })?.url,
    );
    expect((recovery.twitter as { title?: string })?.title).not.toBe(
      (homepage.twitter as { title?: string })?.title,
    );
    expect((recovery.twitter as { description?: string })?.description).not.toBe(
      (homepage.twitter as { description?: string })?.description,
    );
  });

  it.each(RESET_PASSWORD_LOCALES)("locale '%s': canonical is self-referencing, robots is noindex+nofollow", async (locale) => {
    const meta = await generateMetadata({ params: Promise.resolve({ locale }) });
    const expectedUrl = `https://www.fitmesh.fit/${locale}/auth/reset-password`;

    expect((meta.alternates as { canonical?: string })?.canonical).toBe(expectedUrl);
    expect(meta.robots).toMatchObject({ index: false, follow: false });
  });

  it.each(RESET_PASSWORD_LOCALES)("locale '%s': OpenGraph/Twitter are dedicated to recovery, coherent and localized", async (locale) => {
    const meta = await generateMetadata({ params: Promise.resolve({ locale }) });
    const t = TRANSLATIONS[locale];
    const expectedUrl = `https://www.fitmesh.fit/${locale}/auth/reset-password`;
    const og = meta.openGraph as { title?: string; description?: string; url?: string; type?: string };
    const tw = meta.twitter as { title?: string; description?: string };

    expect(meta.title).toBe(t.metaTitle);
    expect(meta.description).toBe(t.metaDescription);
    expect(og.title).toBe(t.metaTitle);
    expect(og.description).toBe(t.metaDescription);
    expect(og.url).toBe(expectedUrl);
    expect(og.type).toBe("website");
    expect(tw.title).toBe(t.metaTitle);
    expect(tw.description).toBe(t.metaDescription);
  });
});
