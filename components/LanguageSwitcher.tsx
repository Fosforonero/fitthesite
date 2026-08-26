"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { locales, localeNames, localeFlags, type Locale } from "@/lib/i18n";
import { LOCALE_COOKIE_NAME } from "@/lib/locale-negotiation";
import { CANONICAL_HOST } from "@/lib/site-url";

/**
 * Persiste la scelta esplicita dell'utente: prevale su IP/Accept-Language
 * alla prossima visita di '/' (vedi middleware.ts). Un anno di durata,
 * SameSite=Lax (letto anche su navigazione top-level da link esterni).
 */
function persistLocaleChoice(locale: Locale) {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

type LocaleOption = { locale: Locale; href: string };

// CANONICAL_HOST (da `lib/site-url.ts`, derivato da SITE_URL — non un
// secondo letterale): `blogLanguages()`/`localeAlternates()` emettono SEMPRE
// hreflang assoluti su questo host, anche quando la pagina è servita da
// un'origine diversa (preview Vercel, `next start` locale). Senza questo
// confronto aggiuntivo, un controllo basato solo su `window.location.origin`
// scarterebbe come "host esterno" ogni alternate reale su qualunque ambiente
// non-produzione — fail-closed corretto in astratto, ma che nasconderebbe il
// fix proprio durante la QA su preview.

/**
 * Vero per un articolo blog (`/xx/blog/qualcosa`, con `qualcosa` presente):
 * è lì che lo slug varia per locale e il naive prefix-swap produce 404. Solo
 * struttura dell'URL — nessun import del catalogo post.
 */
function isBlogArticlePath(pathname: string): boolean {
  const parts = pathname.split("/");
  return locales.includes(parts[1] as Locale) && parts[2] === "blog" && !!parts[3];
}

/**
 * SPRINT P0.14: legge gli `<link rel="alternate" hreflang>` già
 * server-renderizzati in `<head>` da `generateMetadata` — stesso identico
 * output di `blogLanguages()` (blog) / `localeAlternates()` (resto del
 * sito), quindi nessuna seconda mappa locale→slug lato client. Filtra
 * `x-default`, locale non supportate, host esterni ed entry malformate;
 * deduplica deterministicamente (prima occorrenza vince). Ritorna `null` se
 * il documento non espone alcun alternate valido.
 */
function readAlternatesFromHead(): LocaleOption[] | null {
  if (typeof document === "undefined") return null;
  const tags = document.head.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]');
  if (tags.length === 0) return null;

  const seen = new Map<Locale, string>();
  for (const tag of tags) {
    const hreflang = tag.getAttribute("hreflang");
    const href = tag.getAttribute("href");
    if (!hreflang || !href || hreflang === "x-default") continue;
    if (!locales.includes(hreflang as Locale)) continue;
    if (seen.has(hreflang as Locale)) continue;

    let url: URL;
    try {
      url = new URL(href, window.location.origin);
    } catch {
      continue;
    }
    // Mai un host esterno: accettato solo se e' la pagina stessa (produzione)
    // o l'host canonico del sito (preview/locale, dove l'origine servita
    // differisce da SITE_URL pur essendo lo stesso hreflang genuino).
    if (url.origin !== window.location.origin && url.hostname !== CANONICAL_HOST) continue;

    seen.set(hreflang as Locale, url.pathname);
  }
  return seen.size > 0 ? Array.from(seen, ([locale, href]) => ({ locale, href })) : null;
}

/**
 * Selettore lingua a tendina. Mostra la lingua corrente; al click apre il
 * menu con le altre. Chiude su click-fuori e su Esc.
 *
 * SPRINT P0.14: il menu non riceve più un elenco di destinazioni dal server
 * (niente prop, niente Parallel Route) — legge da solo gli alternate già
 * presenti in `<head>` per la route corrente:
 * - articolo blog: SOLO la lingua corrente + le lingue presenti negli
 *   alternate validi; se gli alternate non sono ancora nel DOM, fail-closed
 *   sulla sola lingua corrente (mai lo swap ingenuo come ripiego qui);
 * - pagina non-blog: usa gli alternate quando presenti (stesso insieme di
 *   sempre, tutte le `locales`); se assenti, comportamento storico
 *   invariato (sostituzione del prefisso).
 * Rilegge il DOM a ogni apertura del menu e a ogni cambio pathname: i layout
 * App Router restano montati durante la navigazione client, quindi una
 * cache fra due route riprodurrebbe esattamente il vecchio bug.
 */
export default function LanguageSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname() || `/${current}`;
  const [open, setOpen] = useState(false);
  const [alternates, setAlternates] = useState<LocaleOption[] | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const isBlogArticle = isBlogArticlePath(pathname);

  useEffect(() => {
    setAlternates(readAlternatesFromHead());
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Sostituisce il segmento lingua iniziale (qualsiasi locale supportato) con
  // la lingua target; se manca, lo inserisce. Usa l'elenco centrale `locales`
  // così resta valido aggiungendo nuove lingue (de/pt/fr/...). Fallback
  // storico per le pagine non-blog quando il documento non espone alternate.
  const pathFor = (target: Locale) => {
    const parts = pathname.split("/");
    if (locales.includes(parts[1] as Locale)) {
      parts[1] = target;
    } else {
      parts.splice(1, 0, target);
    }
    return parts.join("/") || `/${target}`;
  };

  const options: LocaleOption[] = isBlogArticle
    ? [{ locale: current, href: pathname }, ...(alternates ?? []).filter((o) => o.locale !== current)]
    : (alternates ?? locales.map((l) => ({ locale: l, href: pathFor(l) })));

  const toggleOpen = () => {
    setAlternates(readAlternatesFromHead());
    setOpen((v) => !v);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Lingua"
        className="inline-flex items-center gap-2 rounded-pill border border-divider bg-bg-card/70 px-3 py-2 text-[12px] font-semibold text-text-secondary transition hover:text-text-primary min-h-[36px]"
      >
        <span aria-hidden className="text-[14px] leading-none">{localeFlags[current]}</span>
        <span className="uppercase tracking-wider">{current}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          aria-hidden
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 min-w-[160px] overflow-hidden rounded-2xl border border-divider bg-bg-elevated shadow-lg"
        >
          {options.map(({ locale: l, href }) => {
            const active = l === current;
            return (
              <li key={l} role="option" aria-selected={active}>
                <Link
                  href={href}
                  hrefLang={l}
                  lang={l}
                  onClick={() => {
                    persistLocaleChoice(l);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 text-[13px] transition ${
                    active
                      ? "bg-bg-card text-text-primary font-semibold"
                      : "text-text-secondary hover:bg-bg-card hover:text-text-primary"
                  }`}
                >
                  <span aria-hidden className="text-[15px] leading-none">{localeFlags[l]}</span>
                  <span>{localeNames[l]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
