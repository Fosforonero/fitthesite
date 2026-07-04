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
  q: Localized;
  a: Localized;
}

/**
 * Sezione di un articolo. Variant-tagged così il renderer fa pattern matching
 * esaustivo. Non aggiungere variant senza estendere `BlogRenderer`.
 */
export type BlogSection =
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
       */
      type: "cta";
      title: Localized;
      body: Localized;
      ctaLabel: Localized;
      ctaHref: Localized;
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
    };

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
