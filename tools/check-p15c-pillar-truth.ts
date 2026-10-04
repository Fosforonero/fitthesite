/**
 * Guardrail del pillar "come-funziona-fitmesh" (riscritto il 02/10/2026,
 * sprint PM S02, per il pillar riscritto in it/en).
 *
 * COSA E' CAMBIATO rispetto alla versione P1.5B Fase C, e perche'
 * (nessun controllo allentato senza un sostituto equivalente o piu' stretto):
 *  - «es/de/pt/fr indicizzabili con 61 entry» e BASELINE_UNTOUCHED_ENTRIES:
 *    SOSTITUITO da «ogni lingua diversa da it/en o non ha testo ed e' incompleta,
 *    non indicizzabile, in 307 (slug in REDIRECT_INCOMPLETE_LOCALE_SLUGS), o ha
 *    TUTTE le entry di it/en». Le quattro lingue sono uscite dal file (opzione A
 *    di PILLAR-DIAGNOSI 5.2): la vecchia regola avrebbe imposto il contrario.
 *  - «callout Fonti e verifica con data»: SOSTITUITO da «nessuna data nel testo
 *    pubblico» e «ogni fonte in sources e' citata nel corpo». La callout con la
 *    data del 5 agosto 2026 sosteneva frasi rimosse e non e' stata riverificata.
 *  - «almeno 8 FAQ»: ALZATO a 9 (schema di PILLAR-DIAGNOSI 4.3).
 *  - em dash: ESTESO a en dash e a tutte le lingue consegnate, FAQ domande incluse.
 *  - pattern assoluti (3): ESTESI ai gruppi A-G di PILLAR-DIAGNOSI 2, ora senza
 *    eccezione per le domande delle FAQ (le domande sono testo pubblico).
 *  - parita' di entry, frase Mesh solo dove meshStatusSentenceRenderable, e stato
 *    di dashboard/Mesh derivato dal registro: nuovi.
 * Per le lingue consegnate in futuro (Gemini) il controllo fallisce se una lingua
 * ha meno entry di it/en, contiene dash o pattern vietati neutri rispetto alla
 * lingua, copia l'inglese, o mostra la frase Mesh dove non e' rendibile.
 */
import { existsSync } from "node:fs";
import { BLOG_POSTS_BY_SLUG } from "@/lib/blog/data";
import { isBlogVariantIndexable, isPostLocaleComplete, REDIRECT_INCOMPLETE_LOCALE_SLUGS, blogLanguages } from "@/lib/blog/indexability";
import { walkPost } from "@/lib/blog/nordic-overlay";
import { blogSeoTitle } from "@/lib/blog/types";
import type { BlogPost } from "@/lib/blog/types";
import { locales, type Locale } from "@/lib/i18n";
import {
  FAMILY_MESH_STATUS_SENTENCE,
  WEB_DASHBOARD_STATUS_SENTENCE,
  isFeatureAvailable,
  meshStatusSentenceRenderable,
} from "@/lib/feature-status";

const SLUG = "come-funziona-fitmesh";
const MIN_FAQ = 9;
/** Sequenza dei tipi di blocco del corpo nella base congelata PILLAR-BASE-v1 (23 blocchi, il 22° e' la frase Mesh). */
const FROZEN_BODY_SHAPE = [
  "heading", "paragraph", // 0-1  S1
  "heading", "paragraph", "paragraph", "paragraph", // 2-5  S2
  "heading", "paragraph", "table", "paragraph", "list", "paragraph", // 6-11 S3
  "heading", "paragraph", // 12-13 S4
  "heading", "list", // 14-15 S5
  "heading", "paragraph", "paragraph", // 16-18 S6
  "heading", "paragraph", "paragraph", // 19-21 S7 (21 = frase Mesh, locales ristretti)
  "fitmesh-editorial-cta", // 22
].join(",");
const FROZEN_FAQ_COUNT = 9;
/**
 * Titoli it delle sette sezioni, nell'ordine della base congelata: con la
 * sequenza dei tipi intercettano anche lo scambio di due blocchi dello stesso
 * tipo fra sezioni. Limite dichiarato: lo scambio di due paragrafi DENTRO la
 * stessa sezione non e' intercettato.
 */
const FROZEN_HEADINGS_IT = [
  "Cos'è FitMesh Sync",
  "Quale problema risolve e per chi",
  "Come raccoglie e unisce le metriche compatibili",
  "Cosa resta nelle app dei produttori",
  "Come iniziare",
  "Limiti, download, prova e Pro",
  "Dove si consultano i dati oggi",
].join(" | ");
const errors: string[] = [];
const fail = (m: string) => errors.push(m);

/** Gruppi A-G di PILLAR-DIAGNOSI sez. 2, solo it/en. Il testo e' controllato DOPO aver tolto le frasi di stato del registro. */
const FORBIDDEN_IT_EN: { label: string; re: RegExp }[] = [
  // A: dashboard web come disponibile, sul web, da browser.
  { label: "A dashboard web", re: /dashboard web|web dashboard|sul web|on the web|browser|panel web/i },
  { label: "A unica dashboard", re: /un'unica dashboard|single dashboard|one dashboard/i },
  // B: doppioni, deduplicazione, somme, valore migliore.
  { label: "B doppioni", re: /doppion|duplicat|dedup|somme sbagliate|wrong (sum|total)s?/i },
  { label: "B valore migliore", re: /(valore|dato) migliore|best (value|data)/i },
  { label: "B elimina ogni", re: /elimina (sempre )?(ogni|tutti)|eliminates? (every|all)/i },
  // C: legge tutto, copertura, non inventa.
  { label: "C tutto", re: /tutti i tuoi dati|all your data|tutti i tuoi wearable|all your wearables|legge tutto|reads everything|indipendentemente dal dispositivo|regardless of (the )?device/i },
  { label: "C non inventa", re: /non (inventa|stima)|never (invents|estimates)|does not (invent|estimate)/i },
  { label: "C importa ogni metrica", re: /importa (automaticamente )?ogni metrica|imports? every (proprietary )?metric/i },
  // D: integrazioni dirette e imminenza.
  { label: "D provider e marchi", re: /\b(Strava|Suunto|Oura|Garmin|Polar|Fitbit|Withings|Samsung|Galaxy)\b|canale diretto|direct channel/i },
  { label: "D in arrivo", re: /in arrivo|coming soon|\bpresto\b|\bsoon\b|prossimamente|\bupcoming\b/i },
  // E: pagamento, Free, importi, Founder.
  { label: "E Free", re: /\bFree\b|piano gratuito|free (plan|tier|version)|gratis per sempre|free forever|a vita gratis|gratuitamente/ },
  { label: "E importi e confronti", re: /[€$£]|\b(euro|eur|usd)\b|\d+[.,]\d{2}\b|caff[eè]|pizza|pochissimo|abbonamento (leggero|piccolo)|small subscription/i },
  { label: "E Founder", re: /founder|\b1\.?000\b/i },
  { label: "E prova completa", re: /prova completa|full (access )?trial|complete trial/i },
  // Q1 e FC A4: nessun abbonamento per piattaforma o durata, nessuna versione gratuita (revisione D3, S2).
  { label: "E abbonamento per piattaforma", re: /semestral|six-month|\b6 mesi\b|\b6 months\b|abbonamento (su|per) iPhone|subscription (on|for) iPhone/i },
  { label: "E versione gratuita", re: /versione gratuita|livello gratuito|storico (di|a) 14 giorni|14-day history/i },
  // MF C46: nessun punteggio o indice di recupero di FitMesh nel testo (revisione D3, S2).
  { label: "C recupero", re: /punteggio di recupero|recovery (score|index)|riposati|rest tonight/i },
  // F: privacy, cancellazione, luogo dei dati, self-host (ammesso solo il rinvio unico, vedi sotto).
  { label: "F privacy e dati", re: /privacy|gdpr|cancellazion|elimin\w* (l')?account|delet|self-host|backup|\bserver\b|\bcloud\b|non vende|do(es)? not sell|pubblicit|advertis|conserv|\bstored\b|retain|sul tuo account|on your account|24 ore|24 hours/i },
  // G: schermate, immagini reali, etichetta «Oggi», cadenze di sync, istantaneo.
  { label: "G schermate", re: /screenshot|schermat|immagini reali|real (images|screenshots)|\.(png|jpe?g|webp)\b/i },
  { label: "G Oggi", re: /dashboard "?oggi"?|"today" dashboard/i },
  { label: "G cadenze", re: /15 minut|15 minutes|istantane|instant/i },
  // Date e assoluti dell'incarico (testo pubblico).
  { label: "data", re: /\b20[2-3]\d\b/ },
  { label: "assoluti it", re: /\b(tutto|tutti|tutte|sempre|mai|qualsiasi|ovunque)\b/i },
  { label: "assoluti en", re: /\b(everything|always|never|any|everywhere|anything)\b|\bevery (watch|device|metric|ring)|\ball (devices|metrics|watches|rings)\b/i },
];

/** Neutri rispetto alla lingua: valgono anche per le lingue consegnate in futuro. */
const FORBIDDEN_ANY_LANG: { label: string; re: RegExp }[] = [
  { label: "em dash o en dash", re: /[–—]/ },
  { label: "importo o valuta", re: /[€$£]|\d+[.,]\d{2}\s?(€|eur|usd)/i },
  { label: "data (anno)", re: /\b20[2-3]\d\b/ },
  { label: "immagine", re: /\.(png|jpe?g|webp)\b/i },
  { label: "Founder", re: /founder|\b1\.?000\b/i },
];

const PRIVACY_LINK = /\]\(\/(?:[a-z]{2}\/)?privacy\)/;
const DELETE_LINK = /\]\(\/delete-account\)/;

/** Tutte le stringhe pubbliche del post per `lc` (stesso perimetro di walkPost, piu' coverAlt), con il percorso. */
function stringsFor(post: BlogPost, lc: Locale): { path: string; text: string }[] {
  const out: { path: string; text: string }[] = [];
  for (const e of walkPost(post, lc)) {
    const v = (e.node as Record<string, unknown>)[lc];
    if (typeof v === "string") out.push({ path: e.path, text: v });
    else if (Array.isArray(v)) v.forEach((s, i) => typeof s === "string" && out.push({ path: `${e.path}.${i}`, text: s }));
  }
  const alt = (post.coverAlt as Record<string, string> | undefined)?.[lc];
  if (alt) out.push({ path: "coverAlt", text: alt });
  return out;
}

/** Una lingua ha testo proprio se almeno una entry (applicabile a lei) ha il suo campo. */
function hasOwnText(post: BlogPost, lc: Locale): boolean {
  return walkPost(post, lc).some((e) => (e.node as Record<string, unknown>)[lc] != null);
}

const post = BLOG_POSTS_BY_SLUG[SLUG];
if (!post) {
  fail(`post "${SLUG}" non trovato in BLOG_POSTS_BY_SLUG`);
} else {
  // Rinvio unico a /privacy e /delete-account (decisione Q3): le rotte devono esistere.
  for (const dir of ["app/(frontend)/[locale]/(marketing)/privacy", "app/(frontend)/delete-account"]) {
    if (!existsSync(dir)) fail(`la rotta del rinvio non esiste: ${dir}`);
  }

  // ── Stato dashboard web e Mesh: deve venire dal registro ───────────────
  for (const key of ["webDashboard", "familyMesh"] as const) {
    if (isFeatureAvailable(key)) {
      fail(`${key} e' disponibile nel registro: il pillar e' scritto per lo stato «non disponibile» e va riscritto, non basta cambiare la flag`);
    }
  }

  // ── Titolo, meta, FAQ, tipo ───────────────────────────────────────────
  for (const lc of ["it", "en"] as const) {
    const rendered = `${blogSeoTitle(post, lc)} · FitMesh`;
    if (rendered.length > 60) fail(`title ${lc} renderizzato lungo ${rendered.length} caratteri (>60): "${rendered}"`);
    const desc = post.metaDescription[lc];
    const len = desc ? [...desc].length : 0;
    if (len < 140 || len > 160) fail(`metaDescription ${lc} lunga ${len} caratteri, attesi 140-160: "${desc}"`);
    if (!isBlogVariantIndexable(post, lc)) fail(`${lc}: non indicizzabile, deve esserlo`);
    if (!isPostLocaleComplete(post, lc)) fail(`${lc}: incompleto, deve esserlo`);
  }
  const faq = post.faq ?? [];
  if (faq.length < MIN_FAQ) fail(`solo ${faq.length} FAQ, richieste almeno ${MIN_FAQ}`);
  // Struttura CONGELATA (PILLAR-BASE-v1, 02/10/2026): i path delle traduzioni
  // (walkPost, nordic-overlay.ts) sono indicizzati sull'ordine di corpo e FAQ.
  // Inserire, togliere o spostare un blocco o una FAQ sposta i path e rende
  // inservibili le traduzioni consegnate sulla base v1: serve una base nuova.
  const bodyShape = post.body.map((b) => b.type).join(",");
  if (bodyShape !== FROZEN_BODY_SHAPE) fail(`struttura del corpo cambiata rispetto a PILLAR-BASE-v1 (congelata): "${bodyShape}"`);
  const headingsIt = post.body.flatMap((b) => (b.type === "heading" ? [b.text.it] : [])).join(" | ");
  if (headingsIt !== FROZEN_HEADINGS_IT) fail(`titoli o ordine delle sezioni cambiati rispetto a PILLAR-BASE-v1 (congelata): "${headingsIt}"`);
  if (faq.length !== FROZEN_FAQ_COUNT) fail(`FAQ ${faq.length}, la base congelata PILLAR-BASE-v1 ne ha ${FROZEN_FAQ_COUNT}`);
  faq.forEach((f, i) => {
    for (const lc of ["it", "en"] as const) {
      if (!f.q[lc]?.trim() || !f.a[lc]?.trim()) fail(`FAQ ${i + 1}: domanda o risposta ${lc} vuota`);
    }
  });
  if (post.ldType && post.ldType !== "BlogPosting" && post.ldType !== "Article") fail(`ldType "${post.ldType}" non ammesso: nessuno schema medicale`);
  for (const r of post.related ?? []) if (!BLOG_POSTS_BY_SLUG[r]) fail(`related "${r}" non esiste`);
  // Nessuna immagine nel pillar finche' non esistono schermate dimostrative (decisione Q7).
  for (const [i, b] of post.body.entries()) {
    if (!["heading", "paragraph", "list", "table", "fitmesh-editorial-cta"].includes(b.type)) fail(`body.${i}: tipo "${b.type}" non ammesso (nessuna immagine nel pillar)`);
  }
  // Fonti: se ci sono, devono essere citate nel corpo (stessa regola di prima); non sono piu' obbligatorie.
  const itEnText = (["it", "en"] as const).flatMap((lc) => stringsFor(post, lc).map((s) => s.text)).join(" ");
  for (const url of post.sources ?? []) if (!itEnText.includes(url)) fail(`fonte "${url}" in sources ma non citata nel corpo`);

  // ── it/en: stato dal registro, pattern vietati, «nell'app», rinvio unico ──
  for (const lc of ["it", "en"] as const) {
    const strings = stringsFor(post, lc);
    const all = strings.map((s) => s.text).join("\n");
    for (const [key, sentence] of [["webDashboard", WEB_DASHBOARD_STATUS_SENTENCE[lc]], ["familyMesh", FAMILY_MESH_STATUS_SENTENCE[lc]]] as const) {
      if (!isFeatureAvailable(key) && !all.includes(sentence)) fail(`${lc}: manca la frase di stato di ${key} presa dal registro: "${sentence}"`);
    }
    let linkStrings = 0;
    for (const { path, text } of strings) {
      const clean = text.replaceAll(WEB_DASHBOARD_STATUS_SENTENCE[lc], "").replaceAll(FAMILY_MESH_STATUS_SENTENCE[lc], "");
      const isLinkString = PRIVACY_LINK.test(clean) && DELETE_LINK.test(clean);
      if (PRIVACY_LINK.test(clean) || DELETE_LINK.test(clean)) {
        linkStrings++;
        if (!isLinkString) fail(`${lc} ${path}: il rinvio deve avere insieme /privacy e /delete-account`);
      }
      for (const { label, re } of FORBIDDEN_IT_EN) {
        if (label.startsWith("F ") && isLinkString) continue; // il rinvio unico e' ammesso (Q3)
        // Il testo del rinvio (link markdown) non e' esente dagli altri gruppi.
        const m = clean.match(re);
        if (m) fail(`${lc} ${path}: pattern vietato [${label}] "${m[0]}" in "${clean.slice(0, 90)}"`);
      }
      // Per FRASE, non per stringa: «nell'app» in un'altra frase non copre la dashboard (revisione D3, S2).
      for (const sentence of clean.split(/(?<=[.!?])\s+/)) {
        if (/dashboard/i.test(sentence) && !/\bapp\b/i.test(sentence)) fail(`${lc} ${path}: "dashboard" senza "nell'app"/"in the app" nella stessa frase: "${sentence.slice(0, 90)}"`);
      }
      for (const { label, re } of FORBIDDEN_ANY_LANG) {
        if (re.test(text)) fail(`${lc} ${path}: ${label}`);
      }
    }
    if (linkStrings !== 1) fail(`${lc}: il rinvio a /privacy e /delete-account deve comparire in una sola stringa, trovate ${linkStrings}`);
  }

  // ── Altre 13 lingue: assenti e in redirect, oppure consegnate e complete ──
  const itEntries = walkPost(post, "it").length;
  // Entry del blocco Mesh (unico blocco con `locales`): contate a parte, cosi' il
  // confronto per le lingue dove la frase Mesh non e' rendibile non e' una
  // tautologia (revisione D3, S1).
  const restrictedIdx = post.body.flatMap((s, i) => ((s as { locales?: readonly string[] }).locales ? [i] : []));
  if (restrictedIdx.length !== 1) fail(`attesi 1 blocco con \`locales\` (la frase Mesh), trovati ${restrictedIdx.length}`);
  const meshEntries = walkPost(post).filter((e) => restrictedIdx.some((i) => e.path.startsWith(`body.${i}.`))).length;
  const redirectRegistered = REDIRECT_INCOMPLETE_LOCALE_SLUGS.has(SLUG);
  const hreflang = blogLanguages(post);
  for (const lc of locales) {
    if (lc === "it" || lc === "en") continue;
    const entries = walkPost(post, lc);
    const indexable = isBlogVariantIndexable(post, lc);
    if (!meshStatusSentenceRenderable(lc)) {
      // La frase Mesh non e' rendibile: nessuna entry applicabile a questa lingua puo' portarla (blocco escluso via `locales`).
      for (const e of entries) {
        const node = e.node as Record<string, unknown>;
        const sentences = [FAMILY_MESH_STATUS_SENTENCE.it, FAMILY_MESH_STATUS_SENTENCE.en, FAMILY_MESH_STATUS_SENTENCE[lc]];
        if ([node.it, node.en, node[lc]].some((v) => typeof v === "string" && sentences.some((s) => v.includes(s)))) {
          fail(`${lc}: la frase Mesh compare in ${e.path} ma meshStatusSentenceRenderable(${lc}) e' falso`);
        }
      }
    }
    if (!hasOwnText(post, lc)) {
      if (indexable || isPostLocaleComplete(post, lc)) fail(`${lc}: senza testo ma indicizzabile o completa`);
      if (!redirectRegistered) fail(`${lc}: senza testo e slug fuori da REDIRECT_INCOMPLETE_LOCALE_SLUGS (noindex con contenuto inglese invece di 307)`);
      if (hreflang[lc]) fail(`${lc}: senza testo ma presente in hreflang`);
      continue;
    }
    // Lingua consegnata: stesso numero di entry di it/en (meno le entry della frase Mesh se non rendibile), nessuna entry vuota o copia dell'inglese.
    const expected = meshStatusSentenceRenderable(lc) ? itEntries : itEntries - meshEntries;
    if (entries.length !== expected) fail(`${lc}: ${entries.length} entry, attese ${expected}`);
    // coverAlt non e' in walkPost: una lingua consegnata deve averlo (il modulo CTA lo controlla check-p19a).
    if (!(post.coverAlt as Record<string, string> | undefined)?.[lc]) fail(`${lc}: consegnata ma senza coverAlt`);
    if (!isPostLocaleComplete(post, lc)) fail(`${lc}: testo parziale (consegna incompleta): o tutte le entry di it/en o nessuna`);
    if (!indexable) fail(`${lc}: consegnata ma non indicizzabile`);
    for (const { path, text } of stringsFor(post, lc)) {
      for (const { label, re } of FORBIDDEN_ANY_LANG) if (re.test(text)) fail(`${lc} ${path}: ${label}`);
    }
    for (const e of entries) {
      const node = e.node as Record<string, unknown>;
      if (typeof node[lc] === "string" && node[lc] === node.en && (node.en as string).length > 25) fail(`${lc} ${e.path}: identico all'inglese (copia, non traduzione)`);
    }
    // Se tutte le lingue sono complete il registro puo' restare: il redirect scatta solo per le incomplete.
  }
}

if (errors.length > 0) {
  console.error(`❌ pillar come-funziona-fitmesh guardrail: ${errors.length} problema/i`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("✅ pillar come-funziona-fitmesh guardrail: it/en indicizzabili e complete, altre lingue assenti e in 307 (o consegnate complete), stato dashboard/Mesh dal registro, nessun pattern vietato A-G, rinvio unico a privacy e cancellazione, meta nei limiti, FAQ >= 9.");
