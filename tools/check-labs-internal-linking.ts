/**
 * Guardrail internal linking FitMesh Labs (P1.1D).
 *
 * Verifica via richieste HTTP reali (redirect:"manual", non lettura statica
 * del codice) contro un server reale (BASE_URL, default http://localhost:3000,
 * pensato per un `next start` in produzione) che:
 *
 *  - Header desktop e MobileMenu, su tutte e 15 le locale del sito, generano
 *    un link "Labs" che punta DIRETTAMENTE a `/it/labs` (locale it) o
 *    `/en/labs` (tutte le altre 14) - mai un URL come `/de/labs` che
 *    richiederebbe un hop di redirect;
 *  - ogni link Labs generato dal sito (nav, tool<->articolo, tool<->pillar,
 *    tool<->tool correlato, articolo/pillar->tool) risolve con uno status
 *    200 DIRETTO (redirect:"manual": zero 3xx, zero 404);
 *  - nessuno slug IT è raggiungibile sotto `/en/labs/...` e nessuno slug EN
 *    sotto `/it/labs/...` (404 atteso in entrambi i casi);
 *  - i link editoriali tool<->articolo e tool<->pillar sono realmente
 *    presenti nell'HTML renderizzato (non solo "esistono in un file
 *    sorgente da qualche parte");
 *  - le URL di fallback ESTERNE (una richiesta diretta a `/de/labs`, mai
 *    generata dalla navigazione del sito dopo il fix P1.1D, ma che deve
 *    continuare a funzionare per chi arriva da un link/bookmark esterno in
 *    una locale non supportata da Labs) continuano a fare 307 verso
 *    `/en/labs` - non è una regressione se il redirect esiste ancora, lo
 *    sarebbe se sparisse.
 *
 * Le uniche 2 verifiche che richiedono un DOM renderizzato (i due link nav
 * "Labs", che devono provenire specificamente dai due componenti Header/
 * MobileMenu e non da un altro elemento della pagina) leggono l'HTML SSR
 * reale via fetch() e isolano il tag <a> tramite i data-testid dedicati
 * (nav-labs-desktop/nav-labs-mobile) - mai un match testuale generico che
 * potrebbe raccogliere un link "Labs" spurio altrove nella pagina.
 */
import { locales, type Locale } from "@/lib/i18n";
import { resolveLabsLocale } from "@/lib/labs/locale-redirect";
import { localizedBlogSlug } from "@/lib/blog/slug-i18n";
import { liveLabsTools, localizedLabsSlug, relatedLabsTools, type LiveLabsTool } from "@/lib/labs/registry";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const HRV_TOOL = liveLabsTools().find((t) => t.key === "hrv-rmssd")!;
const SLEEP_TOOL = liveLabsTools().find((t) => t.key === "sleep-efficiency")!;
const HR_ZONES_TOOL = liveLabsTools().find((t) => t.key === "heart-rate-zones")!;
const HRV_ARTICLE_CANONICAL = "hrv-cose-significato-valori";
const SLEEP_ARTICLE_CANONICAL = "efficienza-del-sonno-formula-calcolo";
const HR_ZONES_ARTICLE_CANONICAL = "perche-zona-2-cambia-smartwatch-app";
const PILLAR_CANONICAL = "metriche-recupero-hrv-sonno-frequenza-cardiaca";

interface RowResult {
  source: string;
  target: string;
  expectedStatus: number;
  actualStatus: number;
  ok: boolean;
}

const rows: RowResult[] = [];
const problems: string[] = [];

async function fetchDirect(url: string): Promise<{ status: number; location: string | null }> {
  const res = await fetch(url, { redirect: "manual" });
  return { status: res.status, location: res.headers.get("location") };
}

/** Isola il tag <a> che contiene un dato data-testid nell'HTML SSR e ne estrae l'href, indipendentemente dall'ordine degli attributi. */
function extractAnchorHref(html: string, testId: string): string | null {
  const markerIdx = html.indexOf(`data-testid="${testId}"`);
  if (markerIdx === -1) return null;
  const tagStart = html.lastIndexOf("<a", markerIdx);
  const tagEnd = html.indexOf(">", markerIdx);
  if (tagStart === -1 || tagEnd === -1) return null;
  const tag = html.slice(tagStart, tagEnd + 1);
  const hrefMatch = tag.match(/href="([^"]*)"/);
  return hrefMatch ? hrefMatch[1] : null;
}

async function record(source: string, target: string, expectedStatus: number) {
  const url = target.startsWith("http") ? target : `${BASE_URL}${target}`;
  const { status } = await fetchDirect(url);
  const ok = status === expectedStatus;
  rows.push({ source, target, expectedStatus, actualStatus: status, ok });
  if (!ok) {
    problems.push(`[${source}] -> ${target}: atteso status ${expectedStatus}, trovato ${status}.`);
  }
}

function toolPath(tool: LiveLabsTool, lc: "it" | "en"): string {
  return `/${lc}/labs/${localizedLabsSlug(tool, lc)}`;
}
function articlePath(canonical: string, lc: "it" | "en"): string {
  return `/${lc}/blog/${localizedBlogSlug(canonical, lc)}`;
}

async function checkNavLinksAcrossAllLocales() {
  for (const locale of locales) {
    const html = await (await fetch(`${BASE_URL}/${locale}`)).text();
    const expected = `/${resolveLabsLocale(locale)}/labs`;

    const desktopHref = extractAnchorHref(html, "nav-labs-desktop");
    const mobileHref = extractAnchorHref(html, "nav-labs-mobile");

    if (desktopHref === null) {
      problems.push(`[nav desktop / ${locale}] link Labs (data-testid=nav-labs-desktop) non trovato in /${locale}.`);
    } else if (desktopHref !== expected) {
      problems.push(`[nav desktop / ${locale}] href="${desktopHref}", atteso "${expected}" (link diretto, mai un hop di redirect).`);
    }
    if (mobileHref === null) {
      problems.push(`[nav mobile / ${locale}] link Labs (data-testid=nav-labs-mobile) non trovato in /${locale}.`);
    } else if (mobileHref !== expected) {
      problems.push(`[nav mobile / ${locale}] href="${mobileHref}", atteso "${expected}" (link diretto, mai un hop di redirect).`);
    }

    // Il link generato deve risolvere 200 diretto (zero hop 3xx), non solo puntare al posto giusto sulla carta.
    if (desktopHref) await record(`nav desktop / ${locale}`, desktopHref, 200);
  }
  console.log(`  ✅ nav Labs verificato su tutte e ${locales.length} le locale (desktop + mobile, sempre link diretto).`);
}

async function checkToolArticlePillarAndRelatedLinks() {
  for (const lc of ["it", "en"] as const) {
    const hrvToolPath = toolPath(HRV_TOOL, lc);
    const sleepToolPath = toolPath(SLEEP_TOOL, lc);
    const hrZonesToolPath = toolPath(HR_ZONES_TOOL, lc);
    const hrvArticlePath = articlePath(HRV_ARTICLE_CANONICAL, lc);
    const sleepArticlePath = articlePath(SLEEP_ARTICLE_CANONICAL, lc);
    const hrZonesArticlePath = articlePath(HR_ZONES_ARTICLE_CANONICAL, lc);
    const pillarPath = articlePath(PILLAR_CANONICAL, lc);

    const hrvToolHtml = await (await fetch(`${BASE_URL}${hrvToolPath}`)).text();
    const sleepToolHtml = await (await fetch(`${BASE_URL}${sleepToolPath}`)).text();
    const hrZonesToolHtml = await (await fetch(`${BASE_URL}${hrZonesToolPath}`)).text();
    const hrvArticleHtml = await (await fetch(`${BASE_URL}${hrvArticlePath}`)).text();
    const sleepArticleHtml = await (await fetch(`${BASE_URL}${sleepArticlePath}`)).text();
    const hrZonesArticleHtml = await (await fetch(`${BASE_URL}${hrZonesArticlePath}`)).text();
    const pillarHtml = await (await fetch(`${BASE_URL}${pillarPath}`)).text();

    // P1.4B: la Zona 2/Heart Rate Zones non appartiene al cluster pillar
    // recovery (HRV/sonno) - niente link forzato tool<->pillar per questo
    // tool, a differenza di HRV/Sleep Efficiency (cluster diverso per tema).
    const presence: Array<[string, string, string]> = [
      [`tool HRV (${lc}) -> articolo HRV`, hrvToolHtml, hrvArticlePath],
      [`tool Sleep (${lc}) -> articolo Sleep`, sleepToolHtml, sleepArticlePath],
      [`tool HR Zones (${lc}) -> articolo Zona 2`, hrZonesToolHtml, hrZonesArticlePath],
      [`tool HRV (${lc}) -> pillar recovery`, hrvToolHtml, pillarPath],
      [`tool Sleep (${lc}) -> pillar recovery`, sleepToolHtml, pillarPath],
      [`tool HRV (${lc}) -> tool Sleep (correlato)`, hrvToolHtml, sleepToolPath],
      [`tool Sleep (${lc}) -> tool HRV (correlato)`, sleepToolHtml, hrvToolPath],
      [`tool HRV (${lc}) -> tool HR Zones (correlato)`, hrvToolHtml, hrZonesToolPath],
      [`tool Sleep (${lc}) -> tool HR Zones (correlato)`, sleepToolHtml, hrZonesToolPath],
      [`tool HR Zones (${lc}) -> tool HRV (correlato)`, hrZonesToolHtml, hrvToolPath],
      [`tool HR Zones (${lc}) -> tool Sleep (correlato)`, hrZonesToolHtml, sleepToolPath],
      [`articolo HRV (${lc}) -> tool HRV`, hrvArticleHtml, hrvToolPath],
      [`articolo Sleep (${lc}) -> tool Sleep`, sleepArticleHtml, sleepToolPath],
      [`articolo Zona 2 (${lc}) -> tool HR Zones`, hrZonesArticleHtml, hrZonesToolPath],
      [`pillar (${lc}) -> tool HRV`, pillarHtml, hrvToolPath],
      [`pillar (${lc}) -> tool Sleep`, pillarHtml, sleepToolPath],
    ];

    for (const [label, html, expectedHref] of presence) {
      if (!html.includes(`href="${expectedHref}"`)) {
        problems.push(`[${label}] link href="${expectedHref}" non trovato nell'HTML renderizzato.`);
      }
    }

    // relatedLabsTools deve confermare la relazione curata a livello di dati, non solo di markup.
    // I 3 tool live sono un grafo completamente connesso (P1.4B).
    const hrvRelated = relatedLabsTools(HRV_TOOL).map((t) => t.key);
    const sleepRelated = relatedLabsTools(SLEEP_TOOL).map((t) => t.key);
    const hrZonesRelated = relatedLabsTools(HR_ZONES_TOOL).map((t) => t.key);
    if (!hrvRelated.includes(SLEEP_TOOL.key)) problems.push(`relatedLabsTools(HRV) non include Sleep Efficiency.`);
    if (!hrvRelated.includes(HR_ZONES_TOOL.key)) problems.push(`relatedLabsTools(HRV) non include Heart Rate Zones.`);
    if (!sleepRelated.includes(HRV_TOOL.key)) problems.push(`relatedLabsTools(Sleep) non include HRV.`);
    if (!sleepRelated.includes(HR_ZONES_TOOL.key)) problems.push(`relatedLabsTools(Sleep) non include Heart Rate Zones.`);
    if (!hrZonesRelated.includes(HRV_TOOL.key)) problems.push(`relatedLabsTools(Heart Rate Zones) non include HRV.`);
    if (!hrZonesRelated.includes(SLEEP_TOOL.key)) problems.push(`relatedLabsTools(Heart Rate Zones) non include Sleep Efficiency.`);

    // Ogni URL della relazione deve risolvere 200 diretto.
    await record(`tool HRV (${lc})`, hrvToolPath, 200);
    await record(`tool Sleep (${lc})`, sleepToolPath, 200);
    await record(`tool HR Zones (${lc})`, hrZonesToolPath, 200);
    await record(`articolo HRV (${lc})`, hrvArticlePath, 200);
    await record(`articolo Sleep (${lc})`, sleepArticlePath, 200);
    await record(`articolo Zona 2 (${lc})`, hrZonesArticlePath, 200);
    await record(`pillar (${lc})`, pillarPath, 200);
  }
  console.log("  ✅ link tool<->articolo, tool<->pillar, tool<->tool correlato: presenti nell'HTML e risolvono 200 diretto (it+en).");
}

async function checkNoCrossLocaleSlug() {
  const crossLocale = [
    `/it/labs/${localizedLabsSlug(HRV_TOOL, "en")}`, // slug EN sotto /it
    `/en/labs/${localizedLabsSlug(HRV_TOOL, "it")}`, // slug IT sotto /en
    `/it/labs/${localizedLabsSlug(SLEEP_TOOL, "en")}`,
    `/en/labs/${localizedLabsSlug(SLEEP_TOOL, "it")}`,
    `/it/labs/${localizedLabsSlug(HR_ZONES_TOOL, "en")}`,
    `/en/labs/${localizedLabsSlug(HR_ZONES_TOOL, "it")}`,
  ];
  for (const path of crossLocale) {
    await record("cross-locale slug (deve essere 404)", path, 404);
  }
  console.log(`  ✅ nessuno slug IT raggiungibile sotto /en/labs, nessuno slug EN sotto /it/labs (404 su tutte e ${crossLocale.length} le combinazioni).`);
}

async function checkExternalFallbackStillRedirects() {
  const nonLabsLocales = locales.filter((lc) => lc !== "it" && lc !== "en");
  for (const lc of nonLabsLocales) {
    const url = `${BASE_URL}/${lc}/labs`;
    const { status, location } = await fetchDirect(url);
    const ok = status === 307 && (location === "/en/labs" || location === `${BASE_URL}/en/labs`);
    rows.push({ source: "fallback esterno (richiesta diretta, non generata dal sito)", target: `/${lc}/labs`, expectedStatus: 307, actualStatus: status, ok });
    if (!ok) {
      problems.push(`[fallback esterno] /${lc}/labs -> atteso 307 verso /en/labs, trovato status ${status} location "${location}".`);
    }
  }
  console.log(`  ✅ fallback esterno /${"{xx}"}/labs -> 307 verso /en/labs ancora funzionante su tutte e ${nonLabsLocales.length} le locale non supportate da Labs (richiesta diretta, non generata dalla navigazione del sito).`);
}

async function main() {
  console.log(`Base URL: ${BASE_URL}`);
  await checkNavLinksAcrossAllLocales();
  await checkToolArticlePillarAndRelatedLinks();
  await checkNoCrossLocaleSlug();
  await checkExternalFallbackStillRedirects();

  console.log(`\nMatrice completa (${rows.length} URL, sorgente -> destinazione -> status):`);
  for (const r of rows) {
    console.log(`  ${r.ok ? "✅" : "❌"} ${r.source} -> ${r.target} [atteso ${r.expectedStatus}, trovato ${r.actualStatus}]`);
  }

  if (problems.length > 0) {
    console.error(`\n❌ Labs internal-linking guardrail: ${problems.length} problema/i\n`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  console.log(
    `\n✅ Labs internal-linking guardrail: ${locales.length} locale (nav desktop+mobile diretto, mai un hop di redirect), link tool<->articolo/pillar/tool-correlato presenti e diretti (it+en), zero slug incrociati it/en, fallback esterno alle locale non supportate ancora 307 verso /en/labs. ${rows.length} URL verificate.`,
  );
}

main().catch((err) => {
  console.error("❌ Labs internal-linking guardrail: errore inatteso", err);
  process.exit(1);
});
