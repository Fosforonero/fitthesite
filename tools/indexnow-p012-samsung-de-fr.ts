/**
 * Ping IndexNow per le 2 URL nuove SPRINT P0.12 FASE 5 — traduzioni DE/FR di
 * fitmesh-samsung-health-usarli-insieme, ora realmente indicizzabili
 * (isBlogVariantIndexable=true verificato pre-merge).
 *
 * NON eseguire prima del GO esplicito di Matteo e prima che il deploy sia
 * READY in produzione — vedi FASE 7 del mandato P0.12 ("IndexNow
 * esclusivamente per le nuove URL DE/FR realmente indicizzabili... niente
 * invio massivo dell'intera sitemap").
 */
const SITE = "https://www.fitmesh.fit";
const KEY = "aed642d85d1553233bd5fdec165b1d94";

const URLS = [
  `${SITE}/de/blog/samsung-health-und-fitmesh-gemeinsam-nutzen`,
  `${SITE}/fr/blog/utiliser-fitmesh-avec-samsung-health`,
];

async function main(): Promise<void> {
  console.log(`${URLS.length} URL:`);
  console.log(URLS.join("\n"));
  const res = await fetch("https://api.indexnow.org/IndexNow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: "www.fitmesh.fit",
      key: KEY,
      keyLocation: `${SITE}/${KEY}.txt`,
      urlList: URLS,
    }),
  });
  console.log(`IndexNow HTTP ${res.status} ${res.statusText}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
