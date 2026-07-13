/**
 * Guardrail social metadata (Sprint P0.4).
 *
 * Verifica via HTTP, contro un server `next start` già in esecuzione
 * (BASE_URL, default http://localhost:3000), che ogni route family abbia
 * un og:image/twitter:image validi e che la gerarchia fallback→specifico
 * sia rispettata. Non si basa sugli hash generati da Next (instabili ad
 * ogni build): la specificità è verificata sulla STRUTTURA del path
 * dell'URL immagine (contiene /blog/, /lp/, /sync/, /fitness-data-sync/
 * oppure nessuno di questi = fallback), non sul valore dell'hash.
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const PRODUCTION_ORIGIN = "https://www.fitmesh.fit";

type Family = "fallback" | "fitness-data-sync" | "blog" | "lp" | "sync-provider";

interface RouteCase {
  path: string;
  family: Family;
}

const ROUTE_CASES: RouteCase[] = [
  { path: "/en", family: "fallback" },
  { path: "/it/integrations", family: "fallback" },
  { path: "/en/integrations", family: "fallback" },
  { path: "/en/about", family: "fallback" },
  { path: "/en/fitness-data-sync", family: "fitness-data-sync" },
  { path: "/it/fitness-data-sync", family: "fitness-data-sync" },
  { path: "/de/fitness-data-sync", family: "fitness-data-sync" },
  { path: "/es/fitness-data-sync", family: "fitness-data-sync" },
  { path: "/en/blog/multiple-smartwatches-duplicate-data", family: "blog" },
  { path: "/en/lp/backup-galaxy-watch", family: "lp" },
  { path: "/en/sync/galaxy-watch", family: "sync-provider" },
];

// Controllo negativo, non bloccante: pagina privata/noindex, verificata solo
// a scopo informativo (nessun requisito di og:image su area autenticata).
const NEGATIVE_CONTROL = "/it/auth/login";

const FAMILY_MARKER: Record<Exclude<Family, "fallback">, string> = {
  "fitness-data-sync": "/fitness-data-sync/opengraph-image",
  blog: "/blog/",
  lp: "/lp/",
  "sync-provider": "/sync/",
};

function extractMeta(html: string, matcher: RegExp): string | null {
  const match = html.match(matcher);
  return match ? match[1] : null;
}

function parseSocialTags(html: string) {
  return {
    ogImage: extractMeta(html, /<meta property="og:image" content="([^"]*)"/),
    ogImageWidth: extractMeta(html, /<meta property="og:image:width" content="([^"]*)"/),
    ogImageHeight: extractMeta(html, /<meta property="og:image:height" content="([^"]*)"/),
    ogImageAlt: extractMeta(html, /<meta property="og:image:alt" content="([^"]*)"/),
    twitterImage: extractMeta(html, /<meta name="twitter:image" content="([^"]*)"/),
    twitterCard: extractMeta(html, /<meta name="twitter:card" content="([^"]*)"/),
  };
}

async function fetchHtml(path: string): Promise<string> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} su ${path}`);
  }
  return res.text();
}

async function main() {
  const errors: string[] = [];

  for (const { path, family } of ROUTE_CASES) {
    let html: string;
    try {
      html = await fetchHtml(path);
    } catch (err) {
      errors.push(`${path}: fetch fallita — ${(err as Error).message}`);
      continue;
    }

    const tags = parseSocialTags(html);

    if (!tags.ogImage) errors.push(`${path}: og:image assente`);
    if (!tags.twitterImage) errors.push(`${path}: twitter:image assente`);
    if (tags.twitterCard !== "summary_large_image") {
      errors.push(`${path}: twitter:card = "${tags.twitterCard}" (atteso summary_large_image)`);
    }
    if (tags.ogImageWidth !== "1200" || tags.ogImageHeight !== "630") {
      errors.push(
        `${path}: dimensioni ${tags.ogImageWidth}x${tags.ogImageHeight} (attese 1200x630)`,
      );
    }
    if (!tags.ogImageAlt || tags.ogImageAlt.trim().length === 0) {
      errors.push(`${path}: og:image:alt vuoto`);
    }

    if (tags.ogImage) {
      const isAbsolute = tags.ogImage.startsWith("http://") || tags.ogImage.startsWith("https://");
      if (!isAbsolute) {
        errors.push(`${path}: og:image non è un URL assoluto ("${tags.ogImage}")`);
      }
      if (tags.ogImage.includes("localhost") && BASE_URL !== "http://localhost:3000") {
        errors.push(`${path}: og:image punta a localhost in un run non-locale`);
      }
      if (tags.ogImage.includes(".vercel.app")) {
        errors.push(`${path}: og:image punta a un dominio Preview Vercel`);
      }
      if (BASE_URL === PRODUCTION_ORIGIN && !tags.ogImage.startsWith(PRODUCTION_ORIGIN)) {
        errors.push(`${path}: og:image non punta a ${PRODUCTION_ORIGIN} ("${tags.ogImage}")`);
      }

      // Specificità per path, non per hash: un'immagine famiglia-specifica
      // deve comparire nel path; il fallback non deve contenere NESSUNO dei
      // marker famiglia.
      if (family === "fallback") {
        const leaked = Object.values(FAMILY_MARKER).find((marker) => tags.ogImage!.includes(marker));
        if (leaked) {
          errors.push(`${path}: attesa immagine fallback ma il path contiene "${leaked}"`);
        }
      } else {
        const marker = FAMILY_MARKER[family];
        if (!tags.ogImage!.includes(marker)) {
          errors.push(
            `${path}: attesa immagine famiglia "${family}" (marker "${marker}") ma og:image = "${tags.ogImage}"`,
          );
        }
      }
    }
  }

  // Controllo negativo — solo log, non contribuisce a errors[].
  try {
    const html = await fetchHtml(NEGATIVE_CONTROL);
    const tags = parseSocialTags(html);
    console.log(
      `ℹ controllo negativo ${NEGATIVE_CONTROL}: og:image ${tags.ogImage ? "presente" : "assente"} (informativo, non bloccante)`,
    );
  } catch (err) {
    console.log(`ℹ controllo negativo ${NEGATIVE_CONTROL}: fetch fallita (informativo) — ${(err as Error).message}`);
  }

  if (errors.length > 0) {
    console.error(`❌ Social metadata guardrail: ${errors.length} problema/i`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  console.log(
    `✅ Social metadata guardrail: ${ROUTE_CASES.length} route verificate contro ${BASE_URL} (fallback + fitness-data-sync + blog + lp + sync-provider), tutte con og:image/twitter:image 1200x630 assoluti e alt non vuoto.`,
  );
}

main().catch((err) => {
  console.error("❌ Social metadata guardrail: errore inatteso", err);
  process.exit(1);
});
