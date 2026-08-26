import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import LanguageSwitcher from "./LanguageSwitcher";
import { LOCALE_COOKIE_NAME } from "@/lib/locale-negotiation";

/**
 * SPRINT P0.14 — guardrail permanente del selettore lingua.
 *
 * Riproduce esattamente il bug corretto (naive prefix-swap su articoli blog
 * con slug che varia per locale) e i 10 casi del contratto FASE D
 * dell'addendum: se una futura modifica reintroduce lo swap ingenuo su una
 * pagina blog, o smette di filtrare x-default/host esterni/duplicati, un
 * test qui sotto fallisce.
 *
 * `next/link` è sostituito da un semplice `<a>`: qui interessa la logica di
 * LanguageSwitcher (quali opzioni, quale href, quando scrive il cookie), non
 * il motore di routing di Next — che non è mai montato in jsdom.
 */
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
    hrefLang,
    lang,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
    hrefLang?: string;
    lang?: string;
    className?: string;
  }) => (
    <a
      href={href}
      // preventDefault: in jsdom un vero click su <a href> tenta una
      // navigazione reale ("Not implemented: navigation to another
      // Document"); qui interessa solo l'onClick di LanguageSwitcher
      // (cookie + chiusura menu), non il motore di routing di Next.
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
      }}
      hrefLang={hrefLang}
      lang={lang}
      className={className}
    >
      {children}
    </a>
  ),
}));

let mockPathname = "/it";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

/** Sostituisce gli alternate in `<head>` con l'elenco dato (href assoluti o relativi). */
function setHeadAlternates(pairs: Array<{ hreflang: string; href: string }>) {
  document.head.querySelectorAll('link[rel="alternate"]').forEach((n) => n.remove());
  for (const { hreflang, href } of pairs) {
    const link = document.createElement("link");
    link.setAttribute("rel", "alternate");
    link.setAttribute("hreflang", hreflang);
    link.setAttribute("href", href);
    document.head.appendChild(link);
  }
}

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: "Lingua" }));
}

/** Etichette visibili delle opzioni correntemente nel menu (una per <li>). */
function optionLabels() {
  return screen.getAllByRole("option").map((li) => li.querySelector("a")?.getAttribute("href"));
}

describe("LanguageSwitcher — SPRINT P0.14", () => {
  beforeEach(() => {
    document.head.querySelectorAll('link[rel="alternate"]').forEach((n) => n.remove());
    document.cookie = `${LOCALE_COOKIE_NAME}=; Path=/; Max-Age=0`;
  });

  afterEach(() => {
    cleanup();
    document.head.querySelectorAll('link[rel="alternate"]').forEach((n) => n.remove());
  });

  it("1. blog con IT/EN/DE: mostra solo IT/EN/DE, ogni href e' lo slug localizzato dell'hreflang", async () => {
    mockPathname = "/it/blog/articolo-slug-it";
    setHeadAlternates([
      { hreflang: "it", href: "https://www.fitmesh.fit/it/blog/articolo-slug-it" },
      { hreflang: "en", href: "https://www.fitmesh.fit/en/blog/article-slug-en" },
      { hreflang: "de", href: "https://www.fitmesh.fit/de/blog/artikel-slug-de" },
    ]);
    render(<LanguageSwitcher current="it" />);
    await waitFor(() => expect(document.head.querySelector('link[hreflang="de"]')).not.toBeNull());
    openMenu();

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(optionLabels()).toEqual(
      expect.arrayContaining(["/it/blog/articolo-slug-it", "/en/blog/article-slug-en", "/de/blog/artikel-slug-de"]),
    );
  });

  it("2. locale incompleta/noindex assente dagli alternate: non compare nel menu", async () => {
    mockPathname = "/it/blog/articolo-slug-it";
    setHeadAlternates([
      { hreflang: "it", href: "https://www.fitmesh.fit/it/blog/articolo-slug-it" },
      { hreflang: "en", href: "https://www.fitmesh.fit/en/blog/article-slug-en" },
    ]);
    render(<LanguageSwitcher current="it" />);
    await waitFor(() => expect(document.head.querySelector('link[hreflang="en"]')).not.toBeNull());
    openMenu();

    const hrefs = optionLabels();
    expect(hrefs).toHaveLength(2);
    // Nessuna delle locale incomplete (es. "fr", mai emesso negli alternate) appare.
    expect(hrefs.some((h) => h?.startsWith("/fr/"))).toBe(false);
  });

  it("3. x-default: ignorato, non e' mai un'opzione selezionabile", async () => {
    mockPathname = "/it/blog/articolo-slug-it";
    setHeadAlternates([
      { hreflang: "it", href: "https://www.fitmesh.fit/it/blog/articolo-slug-it" },
      { hreflang: "x-default", href: "https://www.fitmesh.fit/it/blog/articolo-slug-it" },
    ]);
    render(<LanguageSwitcher current="it" />);
    await waitFor(() => expect(document.head.querySelectorAll('link[rel="alternate"]').length).toBe(2));
    openMenu();

    // Una sola opzione (IT): x-default non genera una seconda voce.
    expect(screen.getAllByRole("option")).toHaveLength(1);
  });

  it("4. URL esterno malevolo: ignorato anche con hreflang valido", async () => {
    mockPathname = "/it/blog/articolo-slug-it";
    setHeadAlternates([
      { hreflang: "it", href: "https://www.fitmesh.fit/it/blog/articolo-slug-it" },
      { hreflang: "en", href: "https://evil.example.com/en/blog/article-slug-en" },
    ]);
    render(<LanguageSwitcher current="it" />);
    await waitFor(() => expect(document.head.querySelectorAll('link[rel="alternate"]').length).toBe(2));
    openMenu();

    const hrefs = optionLabels();
    expect(hrefs).toHaveLength(1);
    expect(hrefs.every((h) => !h?.includes("evil"))).toBe(true);
  });

  it("5. duplicate: deduplicate deterministicamente (prima occorrenza vince)", async () => {
    mockPathname = "/it/blog/articolo-slug-it";
    setHeadAlternates([
      { hreflang: "en", href: "https://www.fitmesh.fit/en/blog/article-slug-en-PRIMO" },
      { hreflang: "en", href: "https://www.fitmesh.fit/en/blog/article-slug-en-SECONDO" },
      { hreflang: "it", href: "https://www.fitmesh.fit/it/blog/articolo-slug-it" },
    ]);
    render(<LanguageSwitcher current="it" />);
    await waitFor(() => expect(document.head.querySelectorAll('link[rel="alternate"]').length).toBe(3));
    openMenu();

    const hrefs = optionLabels();
    expect(hrefs).toHaveLength(2);
    expect(hrefs).toContain("/en/blog/article-slug-en-PRIMO");
    expect(hrefs).not.toContain("/en/blog/article-slug-en-SECONDO");
  });

  it("6. blog senza alternate: soltanto la locale corrente, nessun fallback ingenuo", async () => {
    mockPathname = "/it/blog/articolo-slug-it";
    // Nessun <link rel="alternate"> in head.
    render(<LanguageSwitcher current="it" />);
    openMenu();

    const hrefs = optionLabels();
    expect(hrefs).toEqual(["/it/blog/articolo-slug-it"]);
  });

  it("7. pagina non-blog con alternate: usa gli alternate, non lo swap del prefisso", async () => {
    mockPathname = "/it/support";
    setHeadAlternates([
      { hreflang: "it", href: "https://www.fitmesh.fit/it/support" },
      { hreflang: "en", href: "https://www.fitmesh.fit/en/support" },
    ]);
    render(<LanguageSwitcher current="it" />);
    await waitFor(() => expect(document.head.querySelectorAll('link[rel="alternate"]').length).toBe(2));
    openMenu();

    const hrefs = optionLabels();
    expect(hrefs).toHaveLength(2);
    expect(hrefs).toEqual(expect.arrayContaining(["/it/support", "/en/support"]));
  });

  it("8. pagina non-blog senza alternate: conserva lo swap storico del prefisso (tutte le locale)", async () => {
    mockPathname = "/it/support";
    render(<LanguageSwitcher current="it" />);
    openMenu();

    const hrefs = optionLabels();
    expect(hrefs).toHaveLength(15); // tutte le `locales`
    expect(hrefs).toContain("/en/support");
    expect(hrefs).toContain("/de/support");
  });

  it("9. soft navigation fra due post: al secondo post non restano le destinazioni del primo", async () => {
    mockPathname = "/it/blog/primo-articolo";
    setHeadAlternates([
      { hreflang: "it", href: "https://www.fitmesh.fit/it/blog/primo-articolo" },
      { hreflang: "en", href: "https://www.fitmesh.fit/en/blog/first-article" },
    ]);
    const { rerender } = render(<LanguageSwitcher current="it" />);
    await waitFor(() => expect(document.head.querySelectorAll('link[rel="alternate"]').length).toBe(2));

    // Simula la navigazione client verso un secondo post: Next sostituisce
    // gli alternate in head PRIMA che il componente (rimasto montato) veda
    // il nuovo pathname — stesso ordine qui.
    mockPathname = "/it/blog/secondo-articolo";
    setHeadAlternates([
      { hreflang: "it", href: "https://www.fitmesh.fit/it/blog/secondo-articolo" },
      { hreflang: "de", href: "https://www.fitmesh.fit/de/blog/zweiter-artikel" },
    ]);
    rerender(<LanguageSwitcher current="it" />);
    await waitFor(() => expect(document.head.querySelector('link[hreflang="de"]')).not.toBeNull());

    openMenu();
    const hrefs = optionLabels();
    expect(hrefs).toEqual(expect.arrayContaining(["/it/blog/secondo-articolo", "/de/blog/zweiter-artikel"]));
    expect(hrefs.some((h) => h?.includes("primo-articolo") || h?.includes("first-article"))).toBe(false);
  });

  it("10. scrittura cookie: soltanto dopo il click su un'opzione, mai prima", async () => {
    mockPathname = "/it/support";
    render(<LanguageSwitcher current="it" />);

    expect(document.cookie).not.toContain(`${LOCALE_COOKIE_NAME}=en`);
    openMenu();
    expect(document.cookie).not.toContain(`${LOCALE_COOKIE_NAME}=en`);

    const enOption = screen.getAllByRole("option").find((li) => li.querySelector('a[hreflang="en"]'));
    fireEvent.click(enOption!.querySelector("a")!);

    expect(document.cookie).toContain(`${LOCALE_COOKIE_NAME}=en`);
  });
});
