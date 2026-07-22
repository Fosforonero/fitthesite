# Galaxy Watch — Release Package (P1.3N-B, Fase 10)

Preparato 2026-07-21. Nessun valore qui è inventato: dove il dato reale
non esiste ancora, il campo resta esplicitamente vuoto/`[da compilare]`.
Nessuno di questi contenuti va usato finché i gate reali (Fase 1-11
dell'evento) non sono stati eseguiti con dati reali.

---

## Template PR (da usare all'apertura, dopo il rebase post-evento)

```markdown
## Obiettivo
Pubblicare l'analisi verificata delle metriche salute del nuovo
[nome ufficiale] rispetto a Health Connect e FitMesh: cosa è dato
grezzo, cosa è punteggio proprietario Samsung, cosa FitMesh legge
davvero oggi.

## Nome ufficiale
[da compilare — confermato su: Samsung Newsroom / pagina prodotto]

## Fonti
- [da compilare: URL Samsung Newsroom]
- [da compilare: URL pagina prodotto/specifiche, se citata]
- https://developer.android.com/health-and-fitness/health-connect/data-types
  (già verificato, indipendente dall'evento)

## Specifiche confermate
[da compilare, solo quelle con fonte Samsung diretta]

## Rumor eliminati (non confermati da Samsung)
[da compilare: lista di quanto era nel fact ledger come
`reported_not_confirmed` e non ha ricevuto conferma]

## Verità FitMesh (invariate salvo modifica codice reale)
- FitMesh non legge VO2 max via Health Connect.
- FitMesh non legge temperatura cutanea reale (SkinTemperatureRecord)
  via Health Connect.
- Punteggi proprietari Samsung non leggibili da FitMesh.
- Nessuna integrazione diretta FitMesh↔Galaxy Watch.
- Percorso ordinario: Galaxy Watch → Samsung Health/Health Connect → FitMesh.
- Apnea notturna: solo flag booleano via canale diretto Samsung Health SDK.
- Pressione arteriosa (se citata): stesso canale diretto, mai Health Connect.

## JSON-LD
BlogPosting + FAQPage + BreadcrumbList + ImageObject. Nessun
Product/Review/Offer/AggregateRating/MedicalWebPage. Verificato via
`curl` sul server reale (vedi risultati QA sotto).

## Immagini
Cover: `galaxy-watch-unpacked.webp` (originale FitMesh, nessun logo
Samsung). OG image: 1200×630 PNG, tag singolo verificato.

## Internal linking
`come-funziona-health-connect`, `anello-vs-smartwatch`,
`health-connect-vs-samsung-health`, `guida-sync-wearable-2026`
(bidirezionale, verificato).

## Route matrix
IT/EN 200, 13 locale → 307 singolo hop verso EN, sitemap/feed solo
IT/EN, hreflang it/en/x-default.

## Test
145 test Vitest verdi, guardrail claims + test deliberato violazioni,
truth/corruption/blog-integrity/Bing-SEO/GDPR-YMYL verdi, build+next
start verificato manualmente.

## Limiti
[da compilare: eventuali limiti residui non risolvibili prima del merge]
```

---

## Template report finale

```markdown
# P1.3N — Report pubblicazione Galaxy Watch

Branch: content/p1-3n-galaxy-watch-health-connect
Hash (pre-rebase): [da compilare]
Hash (post-rebase, quello mergiato): [da compilare]

## File modificati
[da compilare: output di `git diff --stat origin/main`]

## URL pubblici
- https://www.fitmesh.fit/it/blog/[slug finale]
- https://www.fitmesh.fit/en/blog/[slug finale]

## Fonti ufficiali usate
[da compilare]

## Claim confermati (confirmed_by_samsung)
[da compilare, dal fact ledger aggiornato]

## Claim parzialmente confermati (confirmed_platform_only)
[da compilare]

## Claim non annunciati (rimossi dall'articolo)
[da compilare]

## Claim contraddetti dall'evento reale
[da compilare]

## Risultati Docker
- typecheck: [da compilare]
- vitest: [da compilare]
- guardrail P1.3N + test deliberato: [da compilare]
- truth/corruption/blog-integrity/Bing-SEO/GDPR-YMYL: [da compilare]
- build: [da compilare]

## QA visuale
Desktop/mobile, Chromium/WebKit: [da compilare]

## Zero Preview Deployment
Verificato: `vercel.json` → `deploymentEnabled: { main: true, "**": false }`.

## Gate GO/NO-GO
[da compilare]
```

---

## Template results log (da incollare in `docs/seo/seo-results-log.md` SOLO dopo il merge reale, nello stesso commit del prossimo aggiornamento utile — non un deploy dedicato)

```markdown
### P1.3N — Galaxy Watch Unpacked, pubblicazione [da compilare data]

- SHA merge: [da compilare]
- Deployment Vercel: [da compilare ID/URL]
- Data/ora reale: [da compilare]
- URL: /it/blog/[slug], /en/blog/[slug]
- IndexNow: inviato [da compilare data], 2 URL (vedi lista sotto)
- Baseline GSC (impressions/clicks al giorno 0): [da compilare]
- Check +14gg ([da compilare data]): [da compilare]
- Check +28gg ([da compilare data]): [da compilare]
- Check +90gg ([da compilare data]): [da compilare]
```

---

## Lista IndexNow (PREPARATA, NON INVIATA)

Solo i due URL indicizzabili di questo post, da inviare **esclusivamente
dopo** la verifica pubblica post-merge (mai da questo preflight, mai
prima del deploy reale):

```
https://www.fitmesh.fit/it/blog/[slug finale]
https://www.fitmesh.fit/en/blog/[slug finale]
```

Endpoint: `https://api.indexnow.org/IndexNow`, key nota (vedi script
precedenti in `tools/indexnow-*.ts`). Nessuno script è stato creato
oggi per questa lista: crearlo e lanciarlo è un'azione della Fase 12 di
domani (post-merge), non di oggi.
