/**
 * Visita del contenuto coperto dal registro dei claim: ogni stringa del post (TS) e ogni voce dell'overlay
 * nordico sv/da, con percorso e lingua. Stesso formato di percorso del test seo-metadata-batch1
 * («ts:body.15.items.it.2», «overlay:faq.0.a.sv»).
 */
import { BLOG_POSTS_BY_SLUG } from "@/lib/blog/data";
import nordicOverlayJson from "@/lib/blog/nordic-overlay.json";
import { fingerprint, normalizeClaimText, segmentClaimSentences } from "./claim-detectors";

export const COVERED_POSTS: Record<string, string> = {
  garmin: "esportare-dati-garmin",
  fitbit: "fitbit-data-not-syncing-android",
  "google-health": "google-health-google-fit",
};

const CONTENT_LANGS = new Set(["it", "en", "es", "de", "pt", "fr", "pl", "tr", "nl", "ja", "ko", "sv", "da", "no", "fi"]);

export type ClaimCell = { path: string; lang: string; text: string };
export type ClaimSentence = { path: string; lang: string; indice: number; testo: string; impronta: string };

export function collectClaimCells(slug: string): ClaimCell[] {
  const out: ClaimCell[] = [];
  const walk = (o: unknown, path: string[], src: string): void => {
    if (typeof o === "string") {
      const lang = [...path].reverse().find((k) => CONTENT_LANGS.has(k));
      if (lang) out.push({ path: `${src}:${path.join(".")}`, lang, text: o });
      return;
    }
    if (Array.isArray(o)) o.forEach((x, i) => walk(x, [...path, String(i)], src));
    else if (o && typeof o === "object") for (const [k, v] of Object.entries(o)) walk(v, [...path, k], src);
  };
  walk((BLOG_POSTS_BY_SLUG as Record<string, unknown>)[slug], [], "ts");
  walk((nordicOverlayJson as Record<string, unknown>)[slug] ?? {}, [], "overlay");
  return out;
}

export function claimSentences(slug: string): ClaimSentence[] {
  const out: ClaimSentence[] = [];
  for (const c of collectClaimCells(slug)) {
    segmentClaimSentences(normalizeClaimText(c.text)).forEach((s, i) => {
      const testo = normalizeClaimText(s);
      out.push({ path: c.path, lang: c.lang, indice: i, testo, impronta: fingerprint(testo) });
    });
  }
  return out;
}
