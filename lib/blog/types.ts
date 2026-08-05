/**
 * Tipi condivisi per il blog (`lib/blog/data.ts`) e per le landing high-intent
 * (`lib/landing/data.ts`). La struttura è JSON-like in TypeScript per due motivi:
 *
 * 1. Type-safety completa — niente MDX/CMS, niente runtime parsing fragile.
 * 2. Render deterministico — i componenti React mappano 1:1 i variant dei
 *    `BlogSection`, quindi un nuovo tipo di sezione richiede un cambio
 *    consapevole in `BlogRenderer`.
 *
 * Tutti i contenuti sono `{ it: string; en: string }` per i18n, riusando il
 * pattern di `lib/providers/data.ts`. NON usiamo MDX/react-markdown: nelle
 * stringhe è ammesso solo `**bold**` light-markdown via `renderInlineBold`.
 */
import type { Locale } from "@/lib/i18n";

export type Localized = {
  it: string;
  en: string;
  es?: string;
  de?: string;
  pt?: string;
  fr?: string;
  pl?: string;
  tr?: string;
  nl?: string;
  ja?: string;
  ko?: string;
  sv?: string;
  da?: string;
  no?: string;
  fi?: string;
};
export type LocalizedList = {
  it: string[];
  en: string[];
  es?: string[];
  de?: string[];
  pt?: string[];
  fr?: string[];
  pl?: string[];
  tr?: string[];
  nl?: string[];
  ja?: string[];
  ko?: string[];
  sv?: string[];
  da?: string[];
  no?: string[];
  fi?: string[];
};

/**
 * Accessor con fallback `es -> en -> it` per stringhe localizzate. Finché i dati
 * TS non hanno la variante `es`, ricade su `en` (poi `it`), così tutto compila.
 */
export function tl(l: Localized, lc: Locale): string {
  return (l as Record<string, string | undefined>)[lc] ?? l.en ?? l.it;
}

/**
 * Accessor con fallback `es -> en -> it` per liste localizzate.
 */
export function tll(l: LocalizedList, lc: Locale): string[] {
  return (l as Record<string, string[] | undefined>)[lc] ?? l.en ?? l.it;
}

export type BlogCategory =
  | "guides" // cornerstone + supporting how-to
  | "comparisons" // compare 1 vs 1
  | "privacy" // GDPR, data handling
  | "ecosystem" // brand ecosystem moves (Google buys Fitbit, etc.)
  | "news"; // release notes / novità app (sezione /novita)

export interface BlogQA {
  /**
   * P1.3M: se presente, questa FAQ è valutata e mostrata SOLO per le locale
   * elencate (assente = tutte, comportamento storico). Vedi
   * `lib/blog/locale-filter.ts` per la semantica esatta e l'unica funzione
   * di filtro condivisa da usare per leggerla.
   */
  locales?: readonly Locale[];
  q: Localized;
  a: Localized;
}

/**
 * Sezione di un articolo. Variant-tagged così il renderer fa pattern matching
 * esaustivo. Non aggiungere variant senza estendere `BlogRenderer`.
 *
 * `locales?` (P1.3M): stessa semantica di `BlogQA.locales` — assente = la
 * sezione si applica a tutte le locale (storico); presente = solo alle
 * locale elencate. Intersecato sull'intera union così vale per OGNI variant
 * senza ripeterlo 7 volte. Leggere sempre tramite
 * `isBlogContentAvailableForLocale`/`filterBlogContentForLocale`
 * (`lib/blog/locale-filter.ts`), mai un controllo ad-hoc.
 */
export type BlogSection = (
  | { type: "heading"; level: 2 | 3; text: Localized }
  | { type: "paragraph"; text: Localized }
  | { type: "list"; ordered?: boolean; items: LocalizedList }
  | {
      type: "callout";
      variant: "info" | "warning" | "tip";
      title?: Localized;
      body: Localized;
    }
  | {
      type: "table";
      caption?: Localized;
      headers: LocalizedList;
      rows: Array<LocalizedList>;
    }
  | {
      /**
       * Due colonne pro/contro o "X vs Y". `aTitle`/`bTitle` sono le intestazioni
       * delle due colonne; `aItems`/`bItems` le rispettive bullet list.
       */
      type: "comparison";
      aTitle: Localized;
      aItems: LocalizedList;
      bTitle: Localized;
      bItems: LocalizedList;
    }
  | {
      /**
       * CTA box inline: titolo, descrizione, link primario. `href` può essere
       * un path relativo (`/it/beta`) o URL assoluto.
       *
       * `ctaId`/`ctaPlacement` (P1.4B, opzionali): se presenti, renderizzati
       * come `data-cta-id`/`data-cta-placement` sull'elemento cliccabile —
       * `OutboundTracker` li usa per gli eventi `cta_view`/`cta_click`.
       * Assenti = nessun tracking aggiuntivo (comportamento storico invariato).
       */
      type: "cta";
      title: Localized;
      body: Localized;
      ctaLabel: Localized;
      ctaHref: Localized;
      ctaId?: string;
      ctaPlacement?: string;
    }
  | {
      /**
       * Immagine inline (es. screenshot anonimizzato nelle guide "come funziona").
       * `src` = path in `public/` servito come `<img>` semplice (non next/image, per
       * non pagare l'ottimizzazione Vercel). `alt` obbligatorio (accessibilità +
       * SEO) e `caption` opzionale, entrambi localizzati. `width`/`height` intrinseci
       * per stabilità del layout (CLS). `narrow` per screenshot verticali da telefono
       * (centrati, larghezza contenuta).
       */
      type: "image";
      src: string;
      alt: Localized;
      caption?: Localized;
      width?: number;
      height?: number;
      narrow?: boolean;
    }
) & { locales?: readonly Locale[] };

/**
 * Hero header dell'articolo. `kicker` è la microcategoria (es. "Guida",
 * "Confronto"), `title` è l'H1, `subtitle` è il sommario sotto l'H1.
 */
export interface BlogHero {
  kicker: Localized;
  title: Localized;
  subtitle: Localized;
}

export interface BlogPost {
  /** URL slug — lowercase, kebab-case, stabile (SEO-critical). */
  slug: string;
  category: BlogCategory;
  /** Date ISO 8601 (es. "2026-05-21"). */
  publishedAt: string;
  /** Stessa data di publish, o data ultima revisione contenuto. */
  updatedAt: string;
  /**
   * Pillar cornerstone hub. Mostrato come badge "Guida principale" e usato dal renderer
   * per allungare il container max-width. Solo i 2 cornerstone hanno `true`.
   */
  pillar?: boolean;
  hero: BlogHero;
  /**
   * Titolo SEO alternativo per `<title>`/og:title/twitter:title/JSON-LD
   * `headline`, usato SOLO quando `hero.title` (l'H1) supera il budget di
   * lunghezza per il title renderizzato (~60 caratteri incluso il suffisso
   * brand). `Partial<Record<Locale, string>>` invece di `Localized`
   * deliberatamente: serve un override sparso (spesso UNA sola locale), non
   * un oggetto che obbliga a riempire `it`/`en` con copie inerti solo per
   * soddisfare il type-check. Locale assenti da questa mappa ricadono su
   * `hero.title` come sempre (nessun cambio per i post che non lo
   * definiscono). L'H1 stesso resta invariato: non va mai accorciato solo
   * per SEO se è già corretto e leggibile (vedi P0.8).
   */
  seoTitle?: Partial<Record<Locale, string>>;
  /** Meta description e OG description. ~140-160 caratteri ideale. */
  metaDescription: Localized;
  /** Parola/frase chiave principale (per `keywords` meta). */
  primaryKeyword: Localized;
  /** Secondary keywords mostrate in meta keywords. */
  secondaryKeywords: LocalizedList;
  /** Tempo lettura stimato in minuti (calcolato a mano, no auto). */
  readMinutes: number;
  /**
   * TL;DR: 3-5 bullet che riassumono l'articolo, mostrati in un box in cima
   * (subito dopo l'header), stile blog Claude. Dà il "succo" in 10 secondi.
   * Opzionale per retrocompatibilità; il box si mostra solo se presente.
   */
  tldr?: LocalizedList;
  /** Sezioni in ordine sequenziale. Render top-to-bottom. */
  body: BlogSection[];
  /** FAQ section (renderizzata come <details>) + JSON-LD FAQPage. */
  faq?: BlogQA[];
  /** Slug di articoli correlati (rendered come card a fondo pagina). */
  related?: string[];
  /** Fonti primarie citate nel contenuto, emesse anche come `citation` nel JSON-LD. */
  sources?: string[];
  /**
   * P1.6 Fase 2: `true` se il post cita già `sources` come link cliccabili
   * scritti a mano nel corpo (pattern "Fonte: [Titolo](url), consultata il
   * ..."), così la sezione "Fonti" condivisa (`components/blog/BlogSources.tsx`)
   * non duplica le stesse fonti in fondo pagina. Assente/false (default) = la
   * sezione condivisa renderizza `sources` automaticamente.
   */
  sourcesRenderedInline?: boolean;
  /**
   * Brand citati nell'articolo. Footer disclaimer auto-inserito:
   * "non affiliato a {brand}, marchi citati...".
   */
  brandsMentioned?: string[];
  /** Tipo di JSON-LD da emettere. Default: "BlogPosting". */
  ldType?: "Article" | "BlogPosting";
}

export const CATEGORY_LABEL: Record<BlogCategory, Localized> = {
  guides: { it: "Guida", en: "Guide", es: "Guía", de: "Anleitung", pt: "Guia", fr: "Guide", pl: "Poradnik", tr: "Rehber", nl: "Handleiding", ja: "ガイド", ko: "가이드" },
  comparisons: { it: "Confronto", en: "Comparison", es: "Comparativa", de: "Vergleich", pt: "Comparação", fr: "Comparatif", pl: "Porównanie", tr: "Karşılaştırma", nl: "Vergelijking", ja: "比較", ko: "비교" },
  privacy: { it: "Privacy", en: "Privacy", es: "Privacidad", de: "Datenschutz", pt: "Privacidade", fr: "Confidentialité", pl: "Prywatność", tr: "Gizlilik", nl: "Privacy", ja: "プライバシー", ko: "개인정보" },
  ecosystem: { it: "Ecosistema", en: "Ecosystem", es: "Ecosistema", de: "Ökosystem", pt: "Ecossistema", fr: "Écosystème", pl: "Ekosystem", tr: "Ekosistem", nl: "Ecosysteem", ja: "エコシステム", ko: "에코시스템" },
  news: { it: "Novità", en: "What's New", es: "Novedades", de: "Neuigkeiten", pt: "Novidades", fr: "Nouveautés", pl: "Nowości", tr: "Yenilikler", nl: "Nieuws", ja: "新着情報", ko: "새 소식" },
};

export function categoryLabel(c: BlogCategory, lc: Locale): string {
  return tl(CATEGORY_LABEL[c], lc);
}

/**
 * Titolo da usare per `<title>`/og:title/twitter:title/JSON-LD `headline`:
 * `seoTitle` se il post lo definisce per questa locale, altrimenti `hero.title`
 * (H1). Unica fonte di verità condivisa da generateMetadata e dal componente
 * pagina (invocazioni separate — vedi blog/[slug]/page.tsx) per evitare che
 * finiscano fuori sincrono.
 */
export function blogSeoTitle(post: Pick<BlogPost, "hero" | "seoTitle">, lc: Locale): string {
  return post.seoTitle?.[lc] ?? tl(post.hero.title, lc);
}
