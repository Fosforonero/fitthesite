# SEO Results Log

> Log dati, non narrazione. Ogni riga registra UNA iniziativa/URL con il suo
> stato attuale nella convenzione a 6 stati (vedi
> [seo-geo-master-plan.md](./seo-geo-master-plan.md), sezione 3). Non
> inventare risultati non ancora misurati: se una riga non ha ancora dati
> 14/28/90 giorni, il campo resta vuoto/`—`, non una stima.

## Convenzione di stato

`rilevato` → `corretto localmente` → `verificato in Docker` →
`deployato in produzione` → `validato post-deploy` → `risultato misurato`.

Dal 2026-07-13 le Preview Deployment Vercel sono disabilitate per branch
non-`main` (`vercel.json` → `git.deploymentEnabled`); lo stadio "in
preview" è sostituito da "verificato in Docker" (build/typecheck/
guardrail/test HTTP eseguiti localmente in container). Righe precedenti
a questa data che usano ancora "in preview" descrivono uno stato reale
del momento in cui sono state scritte, non vanno riscritte.

## Iniziative

### P0.2 — fitness-data-sync category

- **Cosa**: nuova landing `/{it,en,de,es}/fitness-data-sync`, retarget pillar
  `guida-sync-wearable-2026`, consolidamento redirect Garmin/Samsung, link
  interni da home/integrations/provider pages.
- **Commit**: `fbbeb70`, `e6d194e`, `5db340c`, `50606ee`, `6845741`,
  `3afe885` (branch `seo/fitness-data-sync-category`, poi confluito in
  `content/health-connect-duplicate-data` — verificato con
  `git merge-base --is-ancestor 3afe885 9bbc52b`, exit 0).
- **URL**: `/it/fitness-data-sync`, `/en/fitness-data-sync`,
  `/de/fitness-data-sync`, `/es/fitness-data-sync`,
  `/{it,en,de,es,pt,fr,pl,tr,nl,ja,ko}/lp/garmin-health-connect*` → redirect
  308 verso i cluster blog Garmin/Samsung consolidati.
- **Baseline GSC 2026-07-13**: nessuna presenza rilevata per "fitness data
  sync" generico prima del lancio — baseline è zero, non "basso" (vedi
  master plan sezione 3).
- **Stato 2026-07-13**: **validato post-deploy**. Verificato in Fase 4 con
  build/server locale (canonical, hreflang it/en/de/es/x-default, redirect
  308 a singolo hop, JSON-LD WebPage+FAQPage+BreadcrumbList, robots
  indicizzabile), poi ri-verificato in produzione dopo il deploy (vedi
  tabella sotto): tutte e 4 le locale 200, hreflang e JSON-LD identici a
  quanto verificato in locale, redirect Garmin/Samsung 308 a singolo hop
  su tutte le 11 locale su `www.fitmesh.fit`.

### Fix cluster Google Fit

- **Cosa**: correzione cluster Google Fit/Google Health (fonti ufficiali,
  claim FitMesh, slug IT).
- **Commit**: `ccb69c8` (già su `main` — verificato con
  `git merge-base --is-ancestor origin/main HEAD`, il branch di questo
  sprint è avanti, non dietro).
- **Stato**: **deployato** (fa parte della storia di `main`, precede questo
  sprint — non ri-verificato in questo sprint oltre alla conferma di
  ancestry).

### Truth-layer (Sprint P0)

- **Cosa**: fatti iOS platform-corretti, scoping JSON-LD, llms.txt 15
  locale, riconciliazione prezzi/entitlement/capacità prodotto, guardrail
  esteso (trial length, founder review, stato Strava/TrainingPeaks).
- **Commit finali su `main`** (hash rehashati dal rebase pre-merge):
  `1f544c8`, `1e1327f`, `341f48e`, `3b365a1`.
- **Stato**: **validato post-deploy** — live su `www.fitmesh.fit` dal
  merge SHA `e7641d4c6a6d06f3df9e235cb0b8094f79a8eed5`.

### Fix Bing 2026-07-13

- **Cosa**: 2 title EN oltre 70 caratteri
  (`esportare-dati-fitbit-google`, `esportare-dati-garmin`); 7 meta
  description provider fuori range 150-160 caratteri (`suunto` EN, `oura`
  EN, `galaxy-watch` EN, `oneplus-health` EN, `withings` JA,
  `smartphone-android` EN, `amazfit-zepp` EN); 1 noindex accidentale
  (`health-connect-not-syncing` variante NL); warning domain-level backlink
  Bing (off-site, non un bug tecnico, non "corretto" con link artificiali).
- **Commit**: `7fe15db` (hash finale post-rebase; originariamente `5dfa31b`).
- **Verifica di questo sprint (Fase 2, locale)**: `tools/check-bing-seo-recommendations.ts`
  verde (`2 title ≤70c, 7 meta description 150-160c, variante NL
  indicizzabile`). Verifica diretta su server locale: NL
  `health-connect-synchroniseert-niet` → 200, nessun tag `robots noindex`
  (assenza = index,follow, confermato per contrasto con una pagina
  genuinamente noindex), canonical self-referencing corretto, presente in
  sitemap.xml con proprio `<loc>` + hreflang alternates, contenuto body
  NL genuinamente tradotto (non fallback EN, verificato via
  `isBlogVariantIndexable`/`isPostLocaleComplete`, che richiede OGNI campo
  tradotto in NL).
- **Verifica post-deploy (Fase 9, `www.fitmesh.fit`, 2026-07-13T08:4x UTC)**:
  entrambi i title EN 200 e ≤70c (`export-fitbit-data-after-google` 62c,
  `export-garmin-data` 60c); tutte e 7 le meta description 150-160c
  (`suunto` 159, `oura` 157, `galaxy-watch` 156, `oneplus-health` 153,
  `withings` JA 160, `smartphone-android` 156, `amazfit-zepp` 158); NL
  `health-connect-synchroniseert-niet` → 200, nessun `robots noindex`,
  canonical corretto, presente in sitemap.xml (6 occorrenze: 1 `<loc>` +
  5 hreflang alternate da altre locale).
- **Stato**: **validato post-deploy**.

### Nuovo articolo duplicate fitness data (IT/EN)

- **Cosa**: riscrittura dell'articolo esistente
  `piu-smartwatch-insieme-dati-doppi` (IT, slug storico mantenuto) +
  `multiple-smartwatches-duplicate-data` (EN) — corregge l'assunto
  precedente "Health Connect non deduplica" con la distinzione reale tra
  deduplicazione dei totali aggregati (Attività/Sonno, via priorità
  sorgenti) e allenamenti/record grezzi (richiedono diagnosi separata,
  spesso da loop di sincronizzazione).
- **Commit**: `7648009` (hash finale post-rebase; originariamente
  `9bbc52b`). Scritto da Codex in worktree separato — non modificato da
  Claude in questo sprint (vincolo esplicito).
- **Verifica di questo sprint (Fase 3)**: entrambi 200; title IT 62c, EN
  62c (≤70 ✓); meta description IT 153c, EN 147c (120-160 ✓); canonical
  self-referencing; risposta diretta nel primo blocco body dopo l'hero;
  checklist preventiva con 7 fix numerati; distinzione esplicita
  record-grezzi/aggregati/allenamenti nel testo; sezione dedicata "Interrompi
  i loop tra integrazione diretta e Health Connect"; 8 citazioni a fonti
  ufficiali `developer.android.com`/`support.google.com`; immagine
  `/blog/screenshots/come-funziona/02-sync-center.png` presente (200) con
  alt localizzato; CTA verso `/it/fitness-data-sync` e
  `/en/fitness-data-sync`; JSON-LD BlogPosting+FAQPage (7 domande, tutte
  verificate testualmente presenti nel body renderizzato, non solo nello
  structured data) +BreadcrumbList, `inLanguage: it-IT`, author/publisher
  con `@id` validi; le altre 9 locale tutte noindex+308+assenti da
  sitemap/hreflang per questo slug.
- **Verifica post-deploy (Fase 9, `www.fitmesh.fit`)**: IT/EN entrambi 200;
  hreflang e JSON-LD (`BlogPosting`+`FAQPage`+`BreadcrumbList`) identici a
  quanto verificato in locale.
- **Stato**: **validato post-deploy** (già verificato dall'autore Codex nel
  proprio worktree, ri-verificato indipendentemente da Claude sia in
  locale sia in produzione).

### Audit truth-review di questo sprint (Fase 1, nuovo lavoro non preesistente)

- **Cosa 1**: `health-connect-not-syncing.ts` — rimossi i claim "90%"/"60%"
  non fontati e la cornice "nella nostra esperienza con centinaia di
  report" (non verificabile) in 11 lingue, sostituiti con formulazioni
  qualitative ("la maggior parte dei problemi", "la causa più comune/più
  frequente"). Corretti anche 2 bug di traduzione pre-esistenti scoperti
  incidentalmente (PL: placeholder di formato data leaked nel testo; TR:
  frase con termini normativi italiani estranei mescolati per errore di
  traduzione automatica).
- **Cosa 2**: `esportare-dati-garmin.ts` — corretto un claim commerciale
  falso: l'articolo descriveva FitMesh Sync come integrato con Garmin
  Connect "via API ufficiale" (e lo elencava insieme a Strava/TrainingPeaks/
  Final Surge come app "già integrata ufficialmente"). Verificato contro
  `lib/providers/data.ts`: il meccanismo reale oggi è pass-through Health
  Connect (Garmin Connect scrive su Health Connect dal 2024);
  l'integrazione OAuth diretta con la Garmin Health API è roadmap Q3 2026,
  non ancora live. Corretto in 2 occorrenze × 11 lingue.
- **Cosa 3**: `lib/llms-txt.ts` — aggiunta voce `/fitness-data-sync` in
  "Core product" e una riga "Export / write-back status" in "Technical
  facts" (Strava write/TrainingPeaks/RideWithGPS/Google Drive export = in
  development; Health Connect write-back Android e Apple Health write-back
  iOS = live, opt-in, off di default). Prima di questo sprint `/llms.txt`
  non menzionava affatto lo stato export/write-back né la landing
  `/fitness-data-sync` — gap reale trovato in Fase 4, non preesistente nel
  guardrail.
- **Commit**: `8802967` — "fix(seo): remove unsourced stats, correct
  Garmin claim, expand llms.txt" (piano SEO/GEO in commit separato:
  `5b727ca`).
- **Verifica**: `tools/check-llms-consistency.ts` verde prima e dopo ogni
  modifica (verificato con rerun dopo ciascuna correzione, non solo alla
  fine).
- **Verifica post-deploy (Fase 9, `www.fitmesh.fit`)**: `/llms.txt` in
  produzione contiene la riga "Export / write-back status" (assente
  prima di questo sprint) — confermato con
  `curl https://www.fitmesh.fit/llms.txt | grep -c "Export / write-back status"`
  → 1.
- **Stato**: **validato post-deploy**.

### Policy: Vercel deployment solo su `main` (2026-07-13, richiesta esplicita di Matteo)

- **Cosa**: `vercel.json` → `git.deploymentEnabled` (`main: true`,
  `**: false`). Nessuna Preview Deployment per branch feature/content/seo/
  hotfix; un solo deploy di produzione per merge su `main`. Motivato dalla
  Preview SSO-protetta (non ispezionabile via curl) e dal deploy di
  produzione cancellato esternamente incontrati in questo stesso sprint.
- **Commit**: `c1296cd` (branch `chore/vercel-main-only-deploys`, PR #10).
- **Verifica pre-merge (Docker)**: `tsc --noEmit` 0 errori, `next build`
  3427 pagine exit 0, `check-llms-consistency.ts` e
  `check-bing-seo-recommendations.ts` verdi.
- **Verifica del meccanismo stesso**: push del branch confermato via API
  Vercel (`list_deployments` con filtro `since`) — **zero** nuove
  deployment create per quel push, a conferma che la regola ha effetto
  immediato sul commit che la introduce.
- **Merge**: PR #10 mergiata manualmente da Matteo con merge commit
  `e7641d4c6a6d06f3df9e235cb0b8094f79a8eed5`. Questo merge ha generato
  **una sola** deployment di produzione (`dpl_462XUPZ1gybT4wgcXwRW5ZRXpaHd`),
  confermato via API Vercel — nessuna preview parallela.
- **Stato**: **validato post-deploy** (la regola è ora attiva in
  produzione: verificata sia sul push pre-merge sia sul merge stesso).

## Deploy di produzione (Fase 7-9, dati reali)

- **Merge SHA (Sprint P0.3 content)**: `2e653e8866ab323b6b5a0599e18652461eee970f`
  (PR #9, "Create a merge commit", mergiata manualmente da Matteo).
- **Deployment Vercel per quel merge**: `dpl_HjkBFQhsijZWnGBArrn3gcbY3YCt`
  — **CANCELED** esternamente durante la build (nessun errore nei log,
  cancellazione non causata da Claude; nessuna azione di recovery
  tentata, come da istruzione).
- **Merge SHA (policy Vercel main-only)**: `e7641d4c6a6d06f3df9e235cb0b8094f79a8eed5`
  (PR #10, "Create a merge commit", mergiata manualmente da Matteo).
- **Deployment Vercel per quel merge**: `dpl_462XUPZ1gybT4wgcXwRW5ZRXpaHd`
  — **READY**, target `production`, alias `www.fitmesh.fit`/`fitmesh.fit`.
  Build avviata 2026-07-13T08:30:14Z, pronta 2026-07-13T08:39:57Z (~9m37s
  per 3427 pagine). Questo è il deploy che ha effettivamente portato in
  produzione TUTTO il contenuto di questo sprint (P0.2 + fix Bing + nuovo
  articolo + audit truth-review + la policy stessa), perché contiene
  `2e653e8` come antenato.
- **IndexNow**: inviato 2026-07-13T08:48:39Z, 52 URL (solo quelle toccate
  da questo sprint — vedi elenco nelle righe sopra), HTTP 200 da
  `api.indexnow.org`.

| Iniziativa | Commit produzione | Timestamp deploy | URL live verificato | Status code | Canonical | Robots | Sitemap | IndexNow | Controllo 14gg | Controllo 28gg | Controllo 90gg |
|---|---|---|---|---|---|---|---|---|---|---|---|
| P0.2 fitness-data-sync | `e7641d4c` | 2026-07-13T08:39:57Z | `/it,en,de,es/fitness-data-sync` | 200×4 | ✓ | index | ✓ | ✓ | 2026-07-27 | 2026-08-10 | 2026-10-11 |
| Fix Bing | `e7641d4c` | 2026-07-13T08:39:57Z | 2 title + 7 meta + 1 NL | 200×10 | ✓ | index (NL) | ✓ (NL) | ✓ | 2026-07-27 | 2026-08-10 | 2026-10-11 |
| Nuovo articolo duplicate data | `e7641d4c` | 2026-07-13T08:39:57Z | `/it,en/blog/...` | 200×2 | ✓ | index | ✓ | ✓ | 2026-07-27 | 2026-08-10 | 2026-10-11 |
| Audit truth-review P0.3 | `e7641d4c` | 2026-07-13T08:39:57Z | `health-connect-not-syncing`, `esportare-dati-garmin` (11 locale ciascuno), `/llms.txt` | 200 | ✓ | index | n/a | ✓ | 2026-07-27 | 2026-08-10 | 2026-10-11 |
| Redirect Garmin/Samsung | `e7641d4c` | 2026-07-13T08:39:57Z | 11 `/lp/garmin-health-connect*` → 11 blog | 308→200 | n/a | n/a | ✓ (destinazioni) | ✓ (destinazioni) | 2026-07-27 | 2026-08-10 | 2026-10-11 |
| Policy Vercel main-only | `e7641d4c` | 2026-07-13T08:39:57Z | n/a (config, non una pagina) | n/a | n/a | n/a | n/a | n/a | — | — | — |

Nessuna riga sopra è ancora "risultato misurato": i controlli 14/28/90
giorni restano da eseguire alle date indicate, non anticipare un
risultato.

## Decision log

Vedi [seo-geo-master-plan.md](./seo-geo-master-plan.md) sezione 10 per il
formato. Le tre decisioni di questo sprint sono registrate lì; il verdetto
(keep/iterate/revert/inconclusive) va aggiunto QUI come nuova riga dopo il
controllo dei 14 giorni (2026-07-27), non anticipato.
