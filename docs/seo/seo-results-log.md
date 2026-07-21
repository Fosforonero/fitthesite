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

### Sprint P0.4 — OG image sitewide

- **Cosa**: `og:image`/`twitter:image` assenti su tutte le pagine marketing
  prive di un'immagine dedicata (solo blog/[slug], lp/[slug],
  sync/[provider] ce l'avevano). Root cause: `app/opengraph-image.tsx`
  viveva fuori dall'albero di risoluzione metadata del route group
  `(frontend)` (nessun `app/layout.tsx` a livello radice — il progetto usa
  root layout separati per route group), compilato da Next.js come
  endpoint orfano `/opengraph-image` mai referenziato da alcuna pagina
  reale. Confermato nel manifest di build (`● /opengraph-image` fuori da
  qualsiasi `[locale]`) e dal warning
  `metadataBase property... not set, using "http://localhost:3000"`.
- **Route coinvolte**: tutte le pagine sotto `[locale]` prive di file
  dedicato — fallback globale in
  `app/(frontend)/[locale]/opengraph-image.tsx`; immagine dedicata in
  `app/(frontend)/[locale]/(marketing)/fitness-data-sync/opengraph-image.tsx`.
  Scoperta durante la verifica: 9 pagine (`about`, `ai`, `beta`, `blog`
  index, `famiglia`, `integrations`, `novita`, `press`, `roadmap`)
  dichiarano un proprio oggetto `openGraph` in `generateMetadata` — Next.js
  resetta `target.openGraph` in modo stateless ad ogni segmento che
  dichiara un proprio `openGraph` (anche senza `images`), quindi il
  fallback a `[locale]` non veniva ereditato da quelle pagine (verificato
  empiricamente su `/en/integrations` vs `/en/support` + in
  `next/dist/lib/metadata/resolve-metadata.js`). Fix: un
  `opengraph-image.tsx` colocato per ciascuna delle 9, tutti re-export del
  medesimo componente in `lib/og/fallback-image.tsx` — zero duplicazione
  visiva, zero modifiche a `generateMetadata()`.
- **File modificati**: rimosso `app/opengraph-image.tsx`; aggiunti
  `lib/og/fallback-image.tsx`,
  `app/(frontend)/[locale]/opengraph-image.tsx`,
  `app/(frontend)/[locale]/(marketing)/fitness-data-sync/opengraph-image.tsx`,
  9× `app/(frontend)/[locale]/(marketing)/{about,ai,beta,blog,famiglia,
  integrations,novita,press,roadmap}/opengraph-image.tsx`,
  `tools/check-social-metadata.ts` (nuovo guardrail).
- **QA visiva**: immagini renderizzate (1200×630 PNG confermate via
  `file`) e ispezionate direttamente — fallback e fitness-data-sync
  (en/it/de). Trovato e corretto un problema reale: la prima versione
  della composizione fitness-data-sync sovrapponeva l'headline alle icone
  sorgente impilate verticalmente (altezza totale > area disponibile);
  fix: icone sorgente disposte in riga orizzontale, non in colonna.
  `tools/local-vision/analyze-image.sh` citato nello sprint non esiste in
  questo repository — sostituito con ispezione visiva diretta delle PNG
  renderizzate.
- **Guardrail**: nuovo `tools/check-social-metadata.ts` — verifica via
  HTTP 11 route rappresentative (una per famiglia: fallback,
  fitness-data-sync×4 locale, blog, lp, sync-provider) contro un server
  `next start` reale: `og:image`/`twitter:image` presenti, `twitter:card`
  = `summary_large_image`, 1200×630, alt non vuoto, URL assoluto, nessun
  `localhost`/`.vercel.app` fuori da run locali, specificità verificata
  sulla struttura del path (non su hash Next). Controllo negativo
  informativo su `/it/auth/login` (non bloccante).
- **Build Docker**: primo tentativo `pnpm run build` fallito silenziosamente
  (`node pnpm run build` → `Cannot find module '/app/pnpm'`, corepack non
  attivato nello stesso invocation del container — errore di tooling
  locale, non del sito). Comando corretto:
  `corepack enable && corepack prepare pnpm@10.28.0 --activate && pnpm run build`
  — build finale verde, `exit 0`, 3446 pagine.
- **Verifiche Docker**: `tsc --noEmit` 0 errori; `next build` exit 0;
  `check-llms-consistency.ts`, `check-bing-seo-recommendations.ts`,
  `check-blog-integrity.ts`, `check-translation-corruption.ts`,
  `check-social-metadata.ts` tutti verdi; `git diff --check` pulito.
- **Stato**: **verificato in Docker**. Non ancora deployato — PR aperta,
  in attesa di merge manuale.

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

## Incidente tecnico P0.4C — reload automatico iOS Safari (ingresso da Reddit)

- **Segnalazione**: video reale dell'utente,
  `ScreenRecording_07-13-2026 20-39-30_1.MP4` (Matteo, 2026-07-13). Mostra:
  ingresso da Reddit su `fitmesh.fit` → selezione lingua tedesca → `/de`
  visibile brevemente → ricaricamento automatico → pagina di nuovo visibile
  → ulteriore ricaricamento automatico. Dispositivo del segnalatore: iPhone
  Safari, con VPN attiva e AdGuard in background (dettaglio raccolto ma non
  trattato come "problema dell'utente" — vedi sotto).
- **Causa confermata** (non un'ipotesi): ogni singola risposta servita da
  `https://www.fitmesh.fit`/`https://fitmesh.fit` in produzione — documento
  HTML, chunk JS, immagini ottimizzate (`_next/image`), font, payload RSC —
  porta gli header `Accept-CH: Sec-CH-Prefers-Color-Scheme` e
  `Critical-CH: Sec-CH-Prefers-Color-Scheme`. Per la specifica Client Hints,
  `Critical-CH` impone al browser un **retry obbligatorio** di qualunque
  richiesta fatta senza quell'hint già in cache per l'origin — cioè
  esattamente un "reload" automatico alla primissima visita di un contesto
  browser che non ha ancora quell'hint memorizzato. Nessun file di questo
  repository dichiara questi header (verificato via grep esaustivo su
  `next.config.mjs`, `vercel.json`, ogni `headers()`/route handler in
  `app/lib/components`): l'origine è una funzionalità di piattaforma
  (Vercel), non applicativa.
  - Riprodotto in modo **deterministico**, non solo ipotizzato: nuovo
    guardrail `tools/check-anti-loop.ts` (Playwright, rileva l'evento DOM
    reale `beforeunload` — non un conteggio di `framenavigated`, artefatto
    già escluso nello sprint P0.4A) mostra `beforeunload` che scatta su
    **ogni** hit diretto a `/it`, `/en`, `/de` e sull'apex, non solo sui
    redirect. Run contro produzione PRE-fix (2026-07-13, baseline
    "PRIMA"): 205 violazioni totali, ~200 risposte con `Critical-CH`
    presente, `beforeunload` rilevato in 6 scenari su 7.
  - Un secondo problema distinto, solo sull'apex: il redirect
    `fitmesh.fit` → `www.fitmesh.fit` (dichiarato in `next.config.mjs`
    `redirects()`) restituiva anche `Refresh: 0;url=https://www.fitmesh.fit/`
    e `content-type: text/plain` — un comportamento del meccanismo
    dichiarativo Vercel-side per quel redirect, non riproducibile in
    locale, e comunque un doppio hop (apex→www, poi www→lingua) invece di
    uno solo.
  - VPN/AdGuard non sono la causa: il fenomeno è riprodotto in modo
    identico senza nessuno dei due (curl semplice, Playwright senza
    proxy). Sono probabili **amplificatori** (latenza maggiore rende il
    doppio-load visibile invece che istantaneo) e il contesto "browser in-
    app di Reddit" — sempre privo di cache Client Hints pregressa — spiega
    perché la riproduzione da Reddit sia più affidabile di un test manuale
    su Safari già usato in precedenza sullo stesso dominio (che ha già
    l'hint in cache e quindi non mostra il retry).
- **Fix (SHA locale, branch `hotfix/p04c-ios-safari-reload`)**: `7900712`.
  - `middleware.ts`: rimuove esplicitamente `Accept-CH`/`Critical-CH` da
    ogni risposta costruita da middleware (redirect e passthrough);
    canonicalizzazione apex→www riscritta come `NextResponse.redirect`
    esplicito (niente `Refresh`, un solo hop anche quando serve negoziare
    la lingua); round-trip Supabase (`getUser`) ristretto a `/app` e
    `/admin`, non più su ogni pagina marketing pubblica.
  - `next.config.mjs`: rimossi i redirect apex-specifici da `redirects()`
    (ora in middleware); aggiunto override `Accept-CH`/`Critical-CH` a
    stringa vuota su `/(.*)` in `headers()` — copre ANCHE gli asset
    statici (`_next/static`, `_next/image`) che middleware non può
    toccare (matcher li esclude, Next.js non invoca codice applicativo
    per servirli).
  - `lib/dictionaries/de.json`: `hero.heading_1` "Eine globale Dashboard"
    → "Ein globales Dashboard" (Dashboard è neutro in tedesco).
  - **Limite noto**: se `Critical-CH` viene iniettato a valle di
    QUALSIASI header configurabile da questo repository (es. un proxy
    Vercel esterno all'app), questi due livelli di rimozione non
    basterebbero — servirebbe un intervento in Vercel Project Settings.
    Verificabile solo con un controllo header reale post-deploy (vedi
    sotto).
- **Header prima/dopo**: "prima" = 2026-07-13T19:11Z, curl diretto contro
  produzione (pre-fix): apex 308 con `refresh: 0;url=https://www.fitmesh.fit/`,
  `content-type: text/plain`, `accept-ch`/`critical-ch: Sec-CH-Prefers-Color-Scheme`;
  `/it`,`/en`,`/de` 200 con `accept-ch`/`critical-ch` presenti. "Dopo" =
  **da compilare al prossimo controllo, subito dopo il merge e il deploy
  di produzione** — non anticipare un risultato prima della verifica reale.
- **Test su dispositivo reale**: **non eseguito da Claude** — nessuna
  capacità di test su iPhone/Safari fisico o browser in-app Reddit in
  questo ambiente. Playwright (incluso WebKit mobile) non è sufficiente a
  chiudere l'incidente, come esplicitamente richiesto: serve un test
  manuale di Matteo su iPhone Safari reale, incluso un ingresso da Reddit,
  dopo il deploy di produzione, con permanenza sulla pagina per almeno
  60 secondi. Rollback immediato se il loop persiste.
- **Stato**: **verificato in Docker** (build, tsc, guardrail, test
  routing/social/iOS-EU/refresh-loop tutti verdi su questo branch). Non
  ancora deployato — PR aperta, in attesa di revisione e di UN solo
  deploy di produzione dopo approvazione.

### Addendum urgente (2026-07-13, durante lo sprint P0.4D) — il fix P0.4C non è ancora sufficiente

Verifica locale (Docker, non produzione) contro `/en`, `/it` e la nuova
pagina `/delete-account`: `Accept-CH`/`Critical-CH` risultano ancora
presenti con il valore reale su ogni risposta, nonostante il fix P0.4C
già committato in `middleware.ts`/`next.config.mjs`. Causa isolata a una
seconda sorgente, interna alla toolchain del sito, che aggiunge questi
header indipendentemente dal codice applicativo di questo repository (non
un layer Vercel esterno come ipotizzato in P0.4C). Dettaglio tecnico
completo tenuto fuori da questo file pubblico per non pubblicare una
mappa di un problema non ancora risolto; disponibile a richiesta in
sessione.

**PR #12 non va considerato risolutivo per l'incidente P0.4C finché
questo non è corretto e riverificato con un nuovo controllo header
post-fix.**

## Decision log

Vedi [seo-geo-master-plan.md](./seo-geo-master-plan.md) sezione 10 per il
formato. Le tre decisioni di questo sprint sono registrate lì; il verdetto
(keep/iterate/revert/inconclusive) va aggiunto QUI come nuova riga dopo il
controllo dei 14 giorni (2026-07-27), non anticipato.

## Sprint P0.4D — Pagina pubblica di cancellazione account (Google Play/App Store)

**Obiettivo**: rendere disponibile `https://fitmesh.fit/delete-account`,
requisito Google Play per la cancellazione account fuori dall'app. Aggiunta
a PR #12 (`hotfix/p04c-ios-safari-reload`) con commit separati, non una PR
a parte, per un solo merge/deploy finale.

**Route**: `app/(frontend)/delete-account/page.tsx`, non localizzata di
proposito (mai `/it/delete-account`), inglese di default, italiano
disponibile via toggle client-side che aggiorna anche `document.documentElement.lang`.
Aggiunta a `middleware.ts` `NON_LOCALIZED_PREFIXES` + `detectLocale` (fallback
`en` invece di `it` per questa route, altrimenti l'header `x-fitmesh-locale`
avrebbe reso `<html lang="it">` su una pagina il cui SSR è in inglese).

**Logica di cancellazione: verificata, non ricostruita**. Due meccanismi
già live e già correttamente protetti sono stati verificati (non
modificati, dettaglio implementativo non riportato qui) e la pagina si
limita a esporli/collegarli:
- App Flutter: cancellazione immediata, azionabile solo dall'utente
  autenticato sul proprio account, nessuna finestra di grazia. Fuori
  scope (app Flutter non toccata).
- Dashboard web (già live): l'utente autenticato programma la
  cancellazione, che viene eseguita automaticamente dopo 24 ore di
  grazia (non 48 — vedi bonifica claim sotto).
- Percorso email (nuovo su questa pagina, P0 richiesto anche senza login):
  `mailto:privacy@fitmesh.fit?subject=FitMesh%20account%20deletion%20request`.

**Fase 7 (self-service automatico nuovo, magic link/OAuth) deliberatamente
NON implementata**: un self-service già funzionante esiste (dashboard web +
app Flutter, sopra). Costruire un secondo flusso di autenticazione
parallelo sul sito marketing pubblico avrebbe aggiunto superficie di rischio
senza benefico reale, e la spec stessa subordina questa fase a "non
rallentare il rilascio P0". La pagina collega gli utenti autenticati al
self-service esistente e offre l'email a tutti gli altri.

**Gap scoperto durante l'audit di Fase 3, non corretto (fuori scope, serve
approvazione esplicita prima di toccare una funzione Postgres live)**: un
utente proprietario di un gruppo Mesh Famiglia o di una palestra che
richiede la cancellazione dalla dashboard web o via email può, in un caso
limite, non vedere completata la cancellazione automatica pur avendo
ricevuto conferma che è stata programmata. Dettaglio tecnico completo
(meccanismo esatto, tabelle coinvolte) tenuto fuori da questo file
pubblico; disponibile a richiesta in sessione. **Raccomandazione**: fix
dedicato in una migration separata, con approvazione esplicita prima di
applicarla a una funzione Postgres live con cron attivo.

**Bonifica claim GDPR falso (fase 6)**: rimossa l'attribuzione normativa
falsa "GDPR/DSGVO/RGPD/AVG/RODO richiede la cancellazione entro 48 ore" in
24 occorrenze su 5 file (9 lingue in `beta/page.tsx`, 11 lingue nel post
blog `lib/blog/posts/sync-them-all.ts`, IT+EN in `docs/appstore-setup-guide.md`
e nei due draft `docs/drafts/sync-them-all.{en,it}.md`). Il GDPR non fissa
un numero di ore per la cancellazione (art. 17: "senza ingiustificato
ritardo"; l'art. 12(3), citato correttamente altrove nel sito, riguarda la
RISPOSTA a una richiesta, 30 giorni, non l'esecuzione). Le 48 ore sono ora
descritte ovunque come obiettivo operativo interno, non come requisito di
legge. La citazione corretta dell'art. 12 (30 giorni, privacy/page.tsx) è
stata lasciata intatta. Nuovo guardrail: `tools/check-gdpr-claim-guardrail.ts`
(verificato: fallisce sulle 24 occorrenze pre-fix, passa pulito dopo, zero
falsi positivi sulla citazione corretta).

**Retention backup**: non riverificabile dagli MCP tool Supabase disponibili
(nessuno espone il piano/retention PITR del progetto). La pagina NON ripete
un numero non riverificato: rimanda invece alla sezione retention della
Privacy Policy (che già cita "rotazione 7 giorni su backup Supabase
point-in-time recovery"). **HUMAN_ONLY — verificare piano e retention reale
nel pannello Supabase**, idealmente riconciliando questo stesso numero tra
le due pagine.

**Verificato in Docker**: `tsc --noEmit` pulito; `pnpm run build` pulito
(route `/delete-account` generata, 6.57 kB); server reale (`next start`)
verificato via curl: `/delete-account` 200, title/H1/meta description/canonical
(`https://www.fitmesh.fit/delete-account`)/robots `index,follow`/OG+Twitter
(immagine assoluta, 1200x630 PNG servito, 164KB) tutti corretti; JSON-LD
WebPage+Organization+BreadcrumbList+FAQPage (4 domande) presenti; apex
`fitmesh.fit` → `www.fitmesh.fit/delete-account` in un solo hop (308,
nessun header Refresh proprio — resta però il problema Critical-CH sitewide
descritto sopra, non specifico a questa pagina); sitemap.xml e /llms.txt
aggiornati; link funzionante da footer (tutte le lingue), privacy (IT +
EN/fallback su altre 9), support (tutte le lingue). Non ancora deployato.

**Lingue**: solo IT/EN per il contenuto della pagina, come da fase 5 della
spec. Traduzione fatta a mano (non con Ollama: istruzione esplicita
dell'utente durante lo sprint di non usarlo per questo task), riusando
terminologia già stabilita nella Privacy Policy italiana esistente.

### Rilascio P0 minimo (2026-07-13, stesso giorno) — copy corretta, P0.4C completato per davvero

Prima del merge, tre correzioni:

1. **Copy `/delete-account` corretta**: rimossa ogni garanzia che la
   cancellazione dalla dashboard web si completi sempre automaticamente
   entro 24 ore (conseguenza diretta del gap trovato in Fase 3, ancora non
   corretto — vedi sopra). I percorsi presentati come affidabili sono ora
   solo due: cancellazione immediata dall'app mobile, e richiesta manuale
   via privacy@fitmesh.fit (verificata da una persona). La dashboard web è
   menzionata solo con una frase concordata che rimanda esplicitamente a
   privacy@fitmesh.fit se la cancellazione non si completa, senza alcuna
   promessa di completamento automatico. Il percorso email resta sempre
   visibile e cliccabile indipendentemente da tutto il resto.
2. **P0.4C completato**: la causa isolata nell'addendum precedente aveva
   due componenti distinte, corrette entrambe.
   - `Accept-CH`/`Critical-CH`: una libreria di terze parti usata dal sito
     (non applicativa) aggiungeva una propria regola di header dopo quella
     già scritta in questo repo, vincendo su di essa. Corretto avvolgendo
     il risultato finale di quella libreria e filtrando la sua regola come
     ultimo passo, cosa che nessun livello successivo può più sovrascrivere.
   - `Refresh`: causa DIVERSA da quella ipotizzata nell'addendum precedente
     (non la stessa libreria) — un comportamento di compatibilità legacy
     di Next.js stesso, applicato automaticamente a QUALSIASI redirect con
     status "permanente" nella forma specifica usata su una rotta di
     canonicalizzazione host. Corretto usando una forma di redirect
     permanente equivalente per SEO/cache che non ha questo effetto
     collaterale, lasciando invariato il comportamento per le rotte che
     richiedono la preservazione del metodo HTTP.
   - Verificato in Docker (server reale, non solo lettura statica del
     codice): zero `Accept-CH`, zero `Critical-CH`, zero `Refresh` su
     `/delete-account`, sul suo redirect apex, e sitewide (`/en`, `/it`,
     `/de`, root).
3. **Bug nel guardrail stesso, trovato e corretto**: `check-anti-loop.ts`
   contava un evento `beforeunload` che scatta SEMPRE, su qualunque pagina
   (riprodotto identico anche su un sito di controllo estraneo a FitMesh),
   per un motivo legato al ciclo di vita di una pagina browser appena
   aperta prima ancora di navigare altrove — non un reload reale. Il
   contatore non veniva azzerato dopo il primo caricamento, quindi ogni
   scenario partiva già "in errore" per costruzione, indipendentemente da
   un vero loop. Corretto azzerando il contatore subito dopo il primo
   caricamento riuscito: da quel punto in poi conta solo un vero reload
   della pagina di destinazione. Questo NON invalida la diagnosi originale
   del P0.4C (la presenza di `Critical-CH` su ~200 risposte reali era
   stata confermata separatamente via ispezione diretta degli header, non
   tramite questo contatore), ma va tenuto presente rileggendo i numeri
   "prima" già registrati sopra.

**Rieseguito in Docker con il fix del guardrail**: 7/7 scenari verdi
(apex+referrer stile Reddit, apex pulito, www root, /de, /it, /en, WebKit
mobile), tenuti aperti 60s ciascuno: zero richieste di navigazione
ripetute, zero beforeunload dopo il caricamento, zero `Critical-CH`/
`Refresh` su ogni risposta osservata, CTA store cliccabili.

**Stato**: verificato in Docker. Non ancora deployato. Resta comunque
valido quanto già scritto sopra: il test su dispositivo reale (iPhone
Safari, ingresso da Reddit, permanenza ≥60s) va fatto da Matteo dopo il
deploy — nessuna suite automatica lo sostituisce.

**P0.4E** (nuovo sprint separato, apertura subito dopo questo rilascio):
correggere e testare la funzione di cancellazione automatica per il caso
limite di Fase 3, non corretta qui di proposito.

### Post-deploy — verifica pubblica (2026-07-13)

Merge PR #12 → `main` (SHA `9502515`), un solo deployment di produzione
(`dpl_BcRr6qjuPjg6AftFR1Xtb5vkQFiX`, ~14 minuti di build per 3583 pagine
statiche, nessun errore). Zero Preview Deployment generati durante l'intero
sprint (verificato via API prima e dopo ogni push).

Verificato via curl contro `fitmesh.fit`/`www.fitmesh.fit` reali:
apex → 301 → `www.fitmesh.fit/delete-account` in un solo hop, zero
`Refresh`/`Accept-CH`/`Critical-CH`; `www.fitmesh.fit/delete-account` → 200,
title/canonical/robots corretti, link email cliccabile con subject
precompilato visibile senza login; `/it/delete-account` → 404 (non
localizzata); sitemap aggiornata. `check-anti-loop.ts` rieseguito contro
produzione reale (non solo Docker): 7/7 scenari verdi, zero beforeunload,
zero header residui, tenuto 60s ciascuno.

**Stato**: validato post-deploy. Test su iPhone Safari reale (ingresso da
Reddit) resta a carico di Matteo — nessuna suite automatica lo sostituisce.

## Sprint P1.0 — FitMesh Labs + HRV RMSSD Calculator

- **Cosa**: nuova sezione `/labs` (indice + registry tipizzato) e primo tool
  live, `/it/labs/calcolatore-hrv-rmssd` + `/en/labs/hrv-rmssd-calculator` —
  calcolatore RMSSD/deviazione standard da intervalli RR/IBI, calcolo
  interamente client-side (zero rete), formule documentate, fonti citate
  (PMID 8598068, PMID 37438010, Peltola 2012), FAQ, citazione, esempio
  numerico riproducibile. Solo it/en: nessuna pagina indicizzabile nelle
  altre 13 locale (redirect 307 tramite il routing lingua esistente, non un
  nuovo sistema di geolocalizzazione — vedi `lib/labs/locale-redirect.ts`).
- **Branch/worktree**: `seo/labs-hrv-foundation`, worktree separato da
  `site/p06-build189-truth-sync`, partito dal commit `9b3cc99` per esplicita
  richiesta di non toccare/mergiare la PR #13 in corso.
- **Intent mapping (Fase 1)**: primary EN "HRV calculator", secondary
  "RMSSD calculator"/"RR interval calculator"/"SDNN calculator"/"calculate
  HRV from RR intervals"; primary IT "calcolatore HRV", secondary "calcolo
  RMSSD"/"calcolare HRV da intervalli RR"/"calcolatore SDNN"/"intervalli RR
  HRV". Cannibalizzazione verificata contro l'articolo esistente
  `hrv-cose-significato-valori.ts` (2026-05-22): l'articolo risponde
  all'intento informativo ("cos'è/quanto vale la mia HRV"), il Lab
  all'intento operativo ("calcola il mio RMSSD da questi numeri") —
  differenziazione strutturale, non solo di keyword. Collegati
  bidirezionalmente (vedi sotto).
- **Guardrail nuovo**: `tools/check-labs-truth.ts` (`pnpm run
  labs:truth-check`), scope ristretto a `lib/labs/` + route `.../labs/` —
  blocca diagnosi/classificazione di un risultato, valori normativi
  universali (tabelle età/sesso), claim di upload/invio remoto inesistente.
  Verificato che intercetti violazioni reali prima di essere corretto per i
  falsi positivi (2 casi: domande FAQ che pongono il claim vietato solo per
  negarlo nella risposta — aggiunto un guard "è una domanda?" oltre alla
  finestra di negazione già presente).
- **Test matematici**: `lib/labs/hrv/rmssd-math.test.ts`, 26 test — verificati
  contro un'implementazione Python scritta da zero (non riusa le funzioni
  TypeScript sotto test), non solo contro se stessi. Serie costante, serie
  nota, due soli intervalli, dataset da 32 intervalli, tutti i separatori,
  entrambe le unità, valori vuoti/negativi/zero/NaN, ambiguità
  virgola-decimale (3 bug reali trovati e corretti in questa fase: comma
  finale prima di uno spazio scambiato per ambiguo, valori negativi e testo
  non numerico dentro una lista con virgola che facevano fallire l'intero
  chunk invece del solo valore invalido).
- **Internal linking**: articolo HRV → calcolatore (nuovo paragrafo, 11
  lingue, link funzionante solo verso `/it/labs/...` per IT e
  `/en/labs/...` per le altre 10, dato che il Lab non esiste in quelle
  lingue); calcolatore → articolo HRV; footer → `/labs` (tutte le 15
  locale, redirect gestisce le non-it/en); calcolatore → `/fitness-data-sync`
  con CTA che dichiara esplicitamente che FitMesh non importa intervalli RR
  grezzi (verificato: nessun tipo Health Connect/Apple Health per RR grezzi
  in uso nel codice, solo metriche HRV già aggregate dal dispositivo).
- **Decisione rimandata**: l'articolo `hrv-cose-significato-valori.ts`
  (sprint precedente, non di questo sprint) contiene un range HRV
  indicativo per fascia d'età (con proprio disclaimer "non usare per
  diagnosi medica"). Il principio non-negoziabile di P1.0 ("niente tabelle
  universali per età") si applica al nuovo Lab, non retroattivamente a
  questo articolo — segnalato qui esplicitamente invece di correggerlo
  d'ufficio (fuori scope dichiarato) o di ignorarlo silenziosamente.
- **translate-ts.sh — non applicabile, verificato empiricamente**: lo
  strumento richiede almeno 2 lingue già presenti in un gruppo per
  considerarlo traducibile (`len(g.present) < 2` → skip, verificato leggendo
  `ts_localize.py` e riprodotto con un file di test: "0 groups needing
  ['en']" su contenuto solo-IT). Coerente con la convenzione già in uso nel
  sito (IT+EN scritti insieme a mano come coppia base, es.
  `about-copy.ts`/dictionaries — il tool serve solo per ESPANDERE oltre la
  coppia base a una terza lingua). Dato che Labs si ferma deliberatamente a
  IT+EN, non esiste una "terza lingua" per cui il tool possa fare qualcosa:
  EN scritto a mano seguendo la stessa convenzione. `technical-review.sh`
  (qwen2.5-coder:14b) eseguito realmente su `content.ts`: verdetto **PASS
  WITH FIXES** (solo suggerimenti di stile: estrarre URL delle fonti in
  costanti, dare nomi alle "magic number" — nessun problema di correttezza).
  `review.sh` (qwen3:14b) tentato due volte, timeout entrambe le volte per
  contesa di risorse con la build Docker in corso in parallelo — advisory,
  non bloccante per policy del progetto (AGENTS.md: "Prefer mechanically
  verified facts... over local model reports").
- **Verifica privacy reale (Playwright, non lettura statica)**:
  `tools/check-labs-privacy.ts` — digitati 4 valori-marcatore
  fisiologicamente impossibili (813371/824682/795913/801247 ms), calcolato,
  copiato risultati, scaricato CSV: **12 richieste di rete post-load
  osservate, zero contengono i valori marcatore** (né in URL né in
  postData), URL della pagina invariato durante tutta l'interazione,
  clipboard verificato contenere i risultati SOLO dopo il click esplicito,
  download CSV via `blob:` locale (non un URL di rete), zero errori console
  inattesi.
- **Build e guardrail (Docker, `node:22`, tutti exit 0)**: `tsc --noEmit`;
  `vitest run` (57/57 test, inclusi i 26 nuovi); `labs:truth-check` (9 file,
  0 problemi); `seo:truth-check` (112 file scansionati, 0 problemi — include
  il nuovo contenuto Labs); `check-translation-corruption` (107 file, 52200
  stringhe, 0 leak); `check-blog-integrity` (60 post, 0 collisioni);
  `check-bing-seo-recommendations`; `check-gdpr-claim-guardrail` (338 file);
  build produzione completa (exit 0, nessun errore); `check-ios-eu-truth`
  contro server reale (0 claim stale, 307 file); `check-social-metadata`
  contro server reale (11 route); `labs:privacy-check` (vedi sopra).
- **Screenshot**: catturati via Playwright reale (desktop 1440×900, mobile
  390×844) per `/it/labs` e `/it/labs/calcolatore-hrv-rmssd` con dati di
  esempio inseriti — verificati visivamente: layout coerente col resto del
  sito (stessa tipografia, colori brand, pattern breadcrumb/hero/card),
  card "in preparazione" correttamente disabilitate, link footer "FitMesh
  Labs" presente.
- **Commit**: `[da registrare qui il nuovo hash dopo il commit — vedi
  consegna finale in sessione]`.
- **Stato**: verificato in Docker, tutti i gate verdi. Non ancora
  pushato, nessuna PR aperta — richiesta esplicita: attendere che la PR
  #13 sia mergiata, poi rebase su `origin/main` e riverifica completa
  prima di aprire la PR. Nessun merge o deploy autonomo.

### P1.2 — Smart Ring + Smartwatch Authority Refresh

- **Cosa**: refresh editoriale completo (non un nuovo articolo, slug/
  canonical/storico invariati) di `lib/blog/posts/anello-vs-smartwatch.ts`
  (`/it/blog/anello-vs-smartwatch`, `/en/blog/smart-ring-vs-smartwatch`).
  Struttura body interamente nuova (9 sezioni: risposta diretta, tabella,
  notte-ring, giorno-watch, uso insieme + fonte Samsung, 3 configurazioni
  reali con percorso dati verificato, gestione multi-sorgente FitMesh vs
  HealthKit/Health Connect con fonti ufficiali, albero decisionale, limiti),
  FAQ 8 domande identiche a JSON-LD, metadata IT/EN nuovi. Refresh completo
  solo IT/EN (decisione esplicita Matteo); le altre 9 lingue già pubblicate
  ricadono in automatico sul testo EN via il fallback `tl()`/`tll()` già
  esistente in `lib/blog/types.ts` (chiavi locale non popolate per i nuovi
  blocchi) — zero claim falsi residui su quelle 9 lingue per costruzione,
  nessuna traduzione non rivista pubblicata.
- **Baseline GSC al 10/07/2026** (fornita da Matteo, non riverificata
  indipendentemente in questa sessione):

  | Query/pagina | Impression | Click | CTR | Posizione media |
  |---|---|---|---|---|
  | Pagina EN (`/en/blog/smart-ring-vs-smartwatch`) | 23 | 0 | 0% | 23,65 |
  | "smart ring vs smartwatch" | 2 | — | — | 55 |
  | "smartwatch vs smart ring" | 1 | — | — | 50 |
  | "smart ring vs smart watch" | 1 | — | — | 56 |

  Lettura: presenza minima, zero click, posizioni fuori dalla prima pagina
  per tutte le varianti della query primaria EN — coerente con un articolo
  che finora copriva solo il confronto 1:1 "quale scegliere", non l'intento
  "uso combinato" che la query e il refresh indirizzano.
- **Claim rimossi in questo refresh** (Fase 1): "l'app iOS arriva a breve" /
  "iOS app coming very soon" (falso: iOS è live, incluse le 27 storefront
  UE, `lib/product-facts.ts`); "Prova FitMesh in beta" (prodotto pubblico,
  non closed beta, `PRODUCT_STATUS.isClosedBeta: false`); range di prezzo
  Colmi €20-35 non sourciato (rimosso dalla tabella, non più presente);
  claim di autonomia universali per categoria ("5-7 giorni" per l'anello,
  "1-3 giorni" per lo smartwatch, senza distinzione di modello); claim
  "il ring è più accurato" implicito nel vecchio confronto sonno (sostituito
  con un callout esplicito "Cosa NON diciamo"); l'affermazione che l'anello
  Colmi si connetta "solo su Android" (falso: BLE diretto su Android e iOS,
  `lib/providers/data.ts`, `syncMechanism: "direct-ble"`,
  `platforms: ["android", "ios"]`); wording assoluto "elimina i doppi
  conteggi" sostituito con la formulazione prudente prescritta ("prova ad
  evitare somme e sovrapposizioni; alcuni conflitti possono comunque
  richiedere la scelta manuale della sorgente preferita").
- **Fonti citate** (Fase 5, con URL verificato via WebFetch/WebSearch,
  consultate 2026-07-20): Samsung Support — ["Combining Galaxy Ring and
  Galaxy Watch for health tracking"](https://www.samsung.com/us/support/answer/ANS10003609/)
  (modelli nominati: Galaxy Watch7, Galaxy Watch Ultra; comportamento di
  handoff e claim +30% autonomia attribuiti esplicitamente a Samsung, non
  verificati indipendentemente); Apple Developer —
  [HealthKit](https://developer.apple.com/documentation/healthkit)
  (sistema progettato per gestire dati da più fonti); Android Developers —
  [Read aggregated data](https://developer.android.com/health-and-fitness/health-connect/aggregate-data)
  (priorità sorgente impostabile dall'utente, Aggregate API deduplica le
  metriche cumulative come i passi) — quest'ultimo URL già in uso altrove
  nel sito, non una fonte nuova non verificata.
- **Decisione di architettura registrata**: `hero.title` guida sia l'H1 sia
  il tag `<title>` (con suffisso `· FitMesh`) — non esistono due campi
  distinti nel modello dati per "SEO title" e "H1". Usato il testo H1
  prescritto da Matteo (renderizzato anche come `<title>`); la variante
  "SEO title" leggermente diversa non è iniettabile separatamente con lo
  schema attuale — segnalato qui, non deciso silenziosamente altrove.
- **Guardrail nuovo**: `tools/check-ring-watch-article-claims.ts`
  (`pnpm run ring-watch:claims-check`) — impedisce il ritorno di: iOS
  "in arrivo", claim beta fuori contesto, deduplicazione assoluta,
  autonomia senza riferimento al modello, prezzo Colmi non sourciato,
  "ring più accurato" senza fonte, cross-link IT/EN scambiati, un secondo
  array FAQ. Efficacia verificata deliberatamente (reintrodotto un claim
  bandito, confermato il fallimento, ripristinato) prima di considerarlo
  affidabile — stesso pattern già in uso nel progetto per gli altri
  guardrail.
- **Build e verifica (Docker, `node:22` via pnpm, tutti exit 0)**: `pnpm
  install --frozen-lockfile`; `tsc --noEmit`; `vitest run` (84/84 test);
  `check-blog-integrity` (60 post, 0 collisioni); `check-translation-
  corruption` (107 file, 51199 stringhe, 0 leak); `check-gdpr-claim-
  guardrail` (341 file, 0 attribuzioni false); `seo:truth-check` (112 file,
  0 problemi); `ring-watch:claims-check` (0 problemi); build produzione
  completa (`next build`, exit 0). Contro server reale (`next start` in
  Docker, porta pubblicata, guardrail HTTP eseguiti da un secondo
  container `--network host`): `check-ios-eu-truth` (309 file + 9 casi
  HTTP, 0 claim stale); `check-social-metadata` (11 route, og:image/
  twitter:image assoluti 1200×630, alt non vuoto) — un solo avviso
  informativo non correlato (HTTP 500 su `/it/auth/login` per assenza di
  credenziali Supabase reali nell'ambiente locale, atteso, il check lo
  tratta come tale). Verificato manualmente sul server reale: HTTP 200 su
  entrambe le pagine; canonical e hreflang it/en/x-default corretti;
  `<title>` e meta description corrispondono a quanto specificato in Fase
  3; 3 blocchi JSON-LD (BlogPosting, FAQPage con le 8 domande esatte,
  BreadcrumbList); il testo delle 8 domande FAQ compare identico sia nel
  markup visibile sia nel JSON-LD (stesso array sorgente, non duplicato);
  tutti i link interni citati nel testo risolvono a slug reali e
  correttamente localizzati (verificato via `lib/blog/slugs.ts`); sitemap
  include l'URL aggiornato.
- **Screenshot**: catturati via Playwright reale (Docker,
  `mcr.microsoft.com/playwright`, desktop 1440×900 e mobile 390×844) per
  `/it/blog/anello-vs-smartwatch` e `/en/blog/smart-ring-vs-smartwatch` —
  verificati visivamente: layout coerente col resto del sito (tipografia,
  colori brand, hero/TL;DR/tabella/callout/FAQ/fonti/related), nessun
  overflow visibile, tabella a 13 righe leggibile, FAQ in accordion,
  nessun testo tagliato o non tradotto.
- **Zero Preview Deployment**: nessun push, nessuna PR, nessun deploy
  Vercel eseguito o richiesto in questa sessione (`vercel.json` disabilita
  comunque le preview per branch non-`main`, invariato).
- **Commit**: `c518e09` (branch `seo/p1-2-smart-ring-smartwatch-refresh`).
- **Stato**: **verificato in Docker**, tutti i gate verdi. Pushato con PR
  aperta subito dopo la registrazione di questa riga. Nessun merge
  autonomo.
- **Controlli programmati**: 14/28/90 giorni DA CALCOLARE sulla data di
  deploy effettiva (non ancora avvenuto in questa sessione) — vedi
  `seo-geo-master-plan.md` §9 per la convenzione; non anticipare date
  prima che il deploy sia reale.

### P1.2A — Hardening pre-merge delle locale fallback (addendum, PR #18 non mergiata)

- **Scoperta**: il meccanismo per "post/locale con fallback EN non
  indicizzabile" esiste già sitewide (`lib/blog/indexability.ts`,
  `isBlogVariantIndexable`/`isPostLocaleComplete`, usato da
  `blog/[slug]/page.tsx` per robots+hreflang, `sitemap.ts`, `feed.xml`) —
  costruito il 04/07 dopo un incidente reale (136 pagine duplicate
  rilevate). Per QUESTO post, con il refresh P1.2, il meccanismo era già
  correttamente attivo: le 9 lingue non-IT/EN (nordiche incluse) risultavano
  già `noindex,follow`, escluse da hreflang/sitemap/feed prima ancora di
  questo addendum — verificato negli HTTP check di P1.2, non una scoperta
  nuova.
- **Gap reale trovato**: `noindex` da solo non risolve l'incoerenza tra
  `<html lang="es">` (impostato dal layout della route, che non sa nulla
  dello stato di fallback di un singolo post) e il contenuto realmente
  mostrato (inglese). Lo stesso vale per `inLanguage` nel JSON-LD
  (`lib/seo/schema-language.ts`, puramente funzione della locale di route).
  Questo è esattamente il motivo per cui il redirect è preferibile,
  indicato nella richiesta.
- **Decisione presa**: redirect 307 verso `/en/blog/...`, non noindex
  rafforzato — perché un redirect evita il problema alla radice (la pagina
  in quella lingua non viene mai renderizzata, quindi `<html lang>` e
  `inLanguage` sbagliati non possono mai comparire), mentre "riparare" il
  noindex avrebbe richiesto toccare `layout.tsx` (condiviso da OGNI pagina
  di quella locale, non solo il blog) per renderlo consapevole dello stato
  di un singolo post — cambio più invasivo e a raggio più ampio.
- **Scelta di scope esplicita**: il redirect è **opt-in per post**
  (`REDIRECT_INCOMPLETE_LOCALE_SLUGS` in `lib/blog/indexability.ts`, oggi
  contiene solo `anello-vs-smartwatch`), non il nuovo comportamento
  automatico per ogni post con `isBlogVariantIndexable` false. Gli altri
  59 post mantengono il `noindex` esistente. Motivo: estendere il redirect
  a tutti sarebbe un cambio di comportamento sitewide non richiesto in
  questo sprint e non verificato post per post — segnalato qui come
  possibile lavoro futuro, non deciso silenziosamente.
- **Implementazione**: `app/(frontend)/[locale]/(marketing)/blog/[slug]/page.tsx`
  — redirect (Next.js `redirect()`, 307) sia in `generateMetadata` sia nel
  componente pagina, subito dopo la risoluzione del post e PRIMA del
  redirect 308 esistente per slug non canonico (`permanentRedirect`) —
  condizioni mutuamente esclusive, verificato che non si incatenano (vedi
  test HTTP sotto, un solo hop).
- **Guardrail aggiornato**: `tools/check-ring-watch-article-claims.ts`
  aggiunge un check STRUTTURALE (importa i dati veri del post e
  `isBlogVariantIndexable`, non regex) che fallisce se una qualunque
  locale diversa da it/en risultasse indicizzabile per questo post, o se
  il post non fosse registrato in `REDIRECT_INCOMPLETE_LOCALE_SLUGS`.
  Efficacia verificata deliberatamente (rimosso il post dal set,
  confermato il fallimento, ripristinato).
- **Verifica prodotto (Flutter reale, non la copia del sito)**: richiesta
  esplicita di non fidarsi di `lib/providers/data.ts` come fonte primaria.
  Verificato contro `AppFitmesh/flutter_app` (repo reale):
  - Colmi BLE Android: `lib/features/ring/data/ring_ble_client.dart:1-636`
    (`flutter_blue_plus`, pubspec.yaml:56), wired nel sync reale via
    `lib/core/di/providers.dart:392-433`.
  - Colmi BLE iOS: STESSO codice, zero gating `Platform.isIOS` in
    `lib/features/ring/**`; `ios/Runner/Info.plist:65-68` dichiara
    `NSBluetoothAlwaysUsageDescription`/`NSBluetoothPeripheralUsageDescription`
    per il ring; commit `7f5f9191` (2026-06-12) e `e9ad6f98` (2026-07-01)
    confermano il flusso solo-anello su iOS come intenzionale, non un
    accidente. Nessuna prova nei commit di validazione su iPhone fisico
    per il ring (nota già presente altrove nel codice, `health_repository.dart:2010-2011`,
    sulla stessa lacuna per Apple Watch) — non contraddice il claim
    dell'articolo (il meccanismo BLE esiste identico su entrambe le
    piattaforme), ma è una lacuna di test hardware, non di codice.
  - Metriche lette dal ring: battery, passi/distanza/calorie, FC
    riposo+intraday+realtime, SpO2 realtime+storico, stress, HRV/RMSSD,
    sonno con fasi, temperatura (gated R09/R05) —
    `lib/features/ring/data/colmi_protocol.dart` +
    `ring_ble_client.dart:328-558` + `ring_enricher.dart:58-182`.
  - Apple Watch: **nessuna integrazione diretta** — zero
    `WatchConnectivity`/`WCSession` in `lib/`/`ios/`; companion app watchOS
    è backlog dichiarato (`ROADMAP.md:645`, "Sprint 20 futuro"). Unico
    codice Apple-Watch-aware è un'euristica generica su `sourceName`
    HealthKit, esplicitamente segnalata come non verificata su device
    reale nel commento del codice stesso (`health_repository.dart:2005-2017`).
  - Galaxy Watch: **nessuna integrazione diretta** — zero SDK Tizen/Wear OS
    in `lib/`/`android/`; "Samsung Health SDK reattivazione" è
    esplicitamente in una tabella HUMAN_ONLY/disabilitata nel `CLAUDE.md`
    del repo app.
  - Lettura HealthKit: generica, nessun filtro per sorgente in ingresso
    (`health_repository.dart:127-155,500`) — qualunque dato scritto da
    Apple Watch sarebbe letto come qualunque altra sorgente. Confermato
    quindi che "Apple Watch → HealthKit → FitMesh" è un percorso reale, non
    un'illazione. Filtro applicato solo in USCITA (esclude i propri
    campioni scritti e, quando l'anello è appaiato via BLE, esclude il
    pacchetto dell'app OEM del ring per non contare due volte,
    `providers.dart:189-195`).
  - Lettura Health Connect: stesso pattern generico, nessun filtro sorgente
    (`health_repository.dart:157-191,498-506`), permessi ampi
    `android.permission.health.READ_*` (`AndroidManifest.xml:69-86`).
  - **Nessun claim dell'articolo ridotto**: tutti confermati dal codice
    reale dell'app, non solo dalla copia del sito.
  - **Differenza di piattaforma trovata ma non aggiunta all'articolo**
    (fuori scope dichiarato, "non trasformare in guida tecnica"): la sync
    del ring è foreground-only su ENTRAMBE le piattaforme (mai richiamata
    da `background_sync.dart`) — non un'asimmetria Android/iOS, ma un
    limite generale non menzionato nell'articolo. Segnalato, non aggiunto.
- **Gate finale (Docker, tutti exit 0)**: `tsc --noEmit`; `vitest run`
  (84/84); `check-blog-integrity`; `check-translation-corruption`;
  `check-gdpr-claim-guardrail`; `seo:truth-check`; `ring-watch:claims-check`
  (col nuovo check strutturale); build produzione completa. Contro server
  reale (`next start` Docker + guardrail HTTP da container `--network
  host`): tutte e 15 le locale testate — `it`/`en` → 200 self-canonical,
  hreflang solo it/en/x-default su entrambe; le altre 13 (incluse
  sv/da/no/fi nordiche) → **307** verso `/en/blog/smart-ring-vs-smartwatch`,
  un solo hop verificato seguendo il redirect fino al 200 finale, nessuna
  catena; sitemap.xml verificato non contenere più nessuno dei 9 slug
  localizzati non-it/en di questo post (0 occorrenze ciascuno), IT/EN
  ancora presenti; `inLanguage` JSON-LD corretto su IT (`it-IT`) ed EN
  (`en-US`) — non applicabile alle altre locale, che non renderizzano più
  una pagina propria; `check-ios-eu-truth` e `check-social-metadata`
  riverificati contro la nuova route, verdi; robots.txt invariato (200).
- **Zero Preview Deployment** anche in questo giro.
- **Non mergiata**: PR #18 aggiornata con nuovi commit, nessun merge
  autonomo.

### P1.2B — Merge, deploy pubblico, verifica live e IndexNow (2026-07-20)

- **Merge**: autorizzato esplicitamente da Matteo, eseguito da lui via
  GitHub (`mergedBy: Fosforonero`, non da questa sessione). Merge commit
  `11d6a91bb611b8e1d103835524add4e88ed550db` su `main`, merge commit
  normale (non squash/rebase). Branch `seo/p1-2-smart-ring-smartwatch-refresh`
  mantenuto, non cancellato.
- **Deployment Vercel**: un solo status context (`Vercel`) osservato sul
  commit di merge dall'apertura (`pending`, "Vercel is deploying your app",
  14:09:32Z) fino a `success` ("Deployment has completed") — nessun secondo
  deployment parallelo rilevato.
- **Verifica pubblica IT/EN** (`https://www.fitmesh.fit`):
  entrambe 200; `<title>` e canonical corrispondono a quanto specificato
  in Fase 3; hreflang solo it/en/x-default su entrambe; 3 blocchi JSON-LD
  (BlogPosting con `inLanguage` `it-IT`/`en-US` corretti, FAQPage con le 8
  domande, BreadcrumbList); testo delle domande FAQ presente sia nel markup
  visibile sia nel JSON-LD (stessa fonte); og:image/twitter:image assoluti,
  risolvono 200 `image/png`; link interni citati nell'articolo presenti e
  puntano a slug reali.
- **Verifica pubblica delle 13 varianti locale fallback** (es, de, pt, fr,
  pl, tr, nl, ja, ko, sv, da, no, fi): tutte **307** verso
  `/en/blog/smart-ring-vs-smartwatch`, singolo hop verificato seguendo il
  redirect fino al 200 finale (nessuna catena, nessun loop).
- **Sitemap e feed pubblici**: `sitemap.xml` e `blog/feed.xml` (it, en)
  verificati non contenere nessuno dei 9 slug localizzati non-it/en di
  questo post; IT/EN presenti in entrambi.
- **IndexNow**: inviati esclusivamente i 2 URL indicizzabili
  (`https://www.fitmesh.fit/it/blog/anello-vs-smartwatch`,
  `https://www.fitmesh.fit/en/blog/smart-ring-vs-smartwatch`) via
  `tools/indexnow-2026-07-20-ring-watch.ts` — HTTP 200 dall'endpoint
  IndexNow. Nessun URL 307 inviato (per costruzione: lo script elenca solo
  i 2 URL, non itera sulle altre locale).
- **Nessuna verifica pubblica fallita** — nessun commit vuoto, nessun
  redeploy manuale necessario.
- **seo-geo-master-plan.md §9 — controlli GSC programmati**, calcolati
  sulla data di deploy reale (2026-07-20, non la data di stesura del
  piano):
  - **+14 giorni**: 2026-08-03
  - **+28 giorni**: 2026-08-17
  - **+90 giorni**: 2026-10-18
- **Nota su questo aggiornamento**: registrato SOLO in locale su questo
  worktree/branch, non pushato — per non generare un secondo deployment
  Vercel puramente documentale (richiesta esplicita di Matteo). Da
  includere nel prossimo push utile (bundle con altro lavoro reale su
  questo branch, o un push dedicato quando Matteo lo richiede).

### P1.3 — Labs Release + Sleep Efficiency Authority Cluster

- **Cosa**: porta in produzione il lavoro Labs già completato (P1.0/P1.1/
  P1.1B/P1.1C/P1.1D, mai mergiato su `main`) — secondo tool live (Sleep
  Efficiency Calculator), hardening HRV, KaTeX fail-closed, oracle
  matematico indipendente, CSV realmente letto, accessibilità Chromium+
  WebKit, `prefers-reduced-motion`, guardrail dedicati, discoverability
  (Header/MobileMenu/homepage), JSON-LD, internal linking — e costruisce
  il cluster editoriale sonno/HRV attorno ai due calcolatori. Branch
  `seo/p1-3-labs-sleep-authority`, worktree separato, partito da
  `origin/main` aggiornato dopo il merge P1.2 (`11d6a91`).

- **Fase 0 — matrice file-per-file**: il lavoro Labs esisteva su due
  branch mai mergiati, entrambi con lo stesso contenuto Labs byte-per-byte
  ma storie diverse:
  - `sprint-p07-labs-seo` (tip `d4d176d`, msg "isolato dal backend
    Founder") — verificato per diff diretto: **zero** tocchi a
    `lib/founder/*`, `lib/pricing*`, `lib/product-facts.ts`, migration o
    test `founder_p0` rispetto a `origin/main`. Claim del commit
    confermato, non solo assunto.
  - `feat/p11-founder-close-fase0` (tip `176df1c`) — stessa identica
    Labs (diff Labs-only fra i due tip: zero righe), ma con in più
    commit Founder Fase 0 nella storia (chiusura programma, incidente
    trigger) e un secondo, indipendente incidente Founder gestito in
    parallelo (vedi `docs/seo/labs/p11-delivery-report.md`, sezione
    "Incidente Founder trigger").
  - **Scelta**: `d4d176d` come sorgente, per diff mirato file-per-file
    (non un merge/cherry-pick della storia intera, che avrebbe portato
    dentro i commit Founder anche se poi "annullati" da un revert).
  - **Verifica di divergenza da `main`**: per ogni file Labs-correlato,
    controllato `git diff <merge-base> origin/main -- <file>` per capire
    se `main` avesse cambiato indipendentemente qualcosa nel frattempo
    (P1.2/P1.2A). Trovati 2 file con vero conflitto (non "Labs manca
    qualcosa", ma "main ha aggiunto qualcosa che Labs non ha"):
    - `lib/blog/indexability.ts` e `blog/[slug]/page.tsx`: `d4d176d`
      precede il redirect 307 di fallback locale P1.2A — mantenuta la
      versione di `main` (superset stretto), **non** presa da `d4d176d`.
    - `lib/blog/posts/anello-vs-smartwatch.ts`: `d4d176d` ha il body
      pre-refresh P1.2 — mantenuta la versione P1.2 di `main`.
  - **Esclusi esplicitamente** (bundle nello stesso commit storico ma
    fuori scope P1.3): `supabase/migrations/20260629100000_fitness_
    metrics_sleep_apnea.sql`, `app/api/v1/garmin/webhook/sleeps/route.ts`,
    `app/api/v1/suunto/webhook/sleep/route.ts` — la regola esplicita
    "nessuna modifica a Supabase o migration" vale a prescindere dal fatto
    che fossero raggruppati nello stesso commit Labs; il calcolatore Sleep
    Efficiency è client-side puro e non ne ha bisogno.
  - **`tools/check-no-continuous-sync-claim.ts` escluso**: non richiesto
    dallo scope guardrail di P1.3, e la sua unica dipendenza di contenuto
    (fix copy `lib/content/about-copy.ts`, rimozione claim "sync
    continuo") vive esclusivamente sul branch Founder-misto — portarla
    avrebbe significato adottare copy Founder-adiacente per soddisfare un
    guardrail che questo sprint non ha chiesto.
  - **Toolchain riportato da P1.1B** (verificato non-Founder via diff):
    `packageManager: pnpm@11.15.0` pinnato, `vercel.json`
    `--frozen-lockfile` (era `--no-frozen-lockfile`), `package-lock.json`
    non più tracciato (unico lockfile operativo `pnpm-lock.yaml`).
  - **Commit P1.2B (`71b61a2`, locale non pushato)**: recuperato via
    `git show`, verificato che tocca ESCLUSIVAMENTE `seo-results-log.md` +
    `seo-geo-master-plan.md` (più uno script IndexNow one-shot, escluso
    perché fuori dalla condizione "solo results-log/master-plan"), SHA
    (`11d6a91`) e date GSC (2026-08-03/08-17/10-18) confermati corretti,
    applicato via patch (blob hash coincidenti, nessun overwrite di nulla
    di più recente).

- **Bug reali trovati durante la QA Docker (Fase 13), non dal report di
  consegna P1.1 precedente**:
  1. **OG image sempre 404**: sia `labs/opengraph-image.tsx` sia
     `labs/[tool]/opengraph-image.tsx` esportavano `generateImageMetadata()`
     enumerando OGNI locale (o locale×tool) invece dei soli parametri
     della route corrente — Next.js richiede quindi un segmento hashato
     `[__metadata_id__]` che l'URL costruito a mano in `generateMetadata`
     (`openGraph.images`) non poteva mai replicare (404 sempre). Rimossa
     la `images` manuale in entrambe le pagine (la convenzione file
     inietta l'URL corretto da sola, stesso pattern già corretto delle
     pagine blog) e rimosso `generateImageMetadata` da entrambe le route
     immagine (non serve: una sola immagine per route via i segmenti
     `[locale]`/`[tool]` già esistenti). Verificato: un solo tag
     `og:image` per pagina, risolve 200 `image/png` 1200×630 reale
     (controllato visivamente).
  2. **Regressione `prefers-reduced-motion`** su tutte e 4 le pagine
     Labs: `components/Footer.tsx` (renderizzato sitewide, incluso sotto
     Labs) aveva 3 span `animate-ping`/`animate-pulse` non corretti. Il
     fix vive solo sul branch Founder-misto, nello stesso hunk di una
     riscrittura copy Founder non correlata (pillola datata, import
     `lib/founder/program-window`) — applicata SOLO la classe
     `motion-reduce:animate-none` ai 3 span, zero copy/logica Founder
     adottata.
  - Il report P1.1 precedente non aveva rilevato nessuno dei due: il
    controllo OG verificava solo che il TESTO del tag differisse fra
    tool (mai che l'URL risolvesse), e il controllo reduced-motion
    copriva solo i 3 elementi già noti allora (Header, sync/[provider]),
    non Footer.tsx (il quarto elemento, sync/[provider], era stato
    aggiunto in P1.1B Fase 4 — Footer.tsx non era mai stato riscannerizzato
    da quando il fix era stato spostato sul branch Founder).
  3. **Em-dash nel copy visibile del cluster**: 15 occorrenze reali (non
     in commento) in `efficienza-del-sonno-formula-calcolo.ts` (8),
     `metriche-recupero-hrv-sonno-frequenza-cardiaca.ts` (6) e
     `HrvCharts.tsx` (1, etichetta outlier nella tabella RR) — violazione
     della regola sitewide "niente em-dash", esplicitamente richiesta come
     guardrail da questo sprint ("em dash nello scope Labs", Fase 12) ma
     mai verificata dal report P1.1 (nessun guardrail dedicato esisteva).
     Corrette tutte e 15 (virgola/due punti/parentesi al posto dell'em-dash,
     stesso significato). Aggiunto nuovo guardrail
     `pnpm run labs:no-em-dash-check` (`tools/check-labs-no-em-dash.ts`,
     15 file di contenuto Labs scansionati, righe di commento escluse) —
     efficacia verificata deliberatamente (iniettata una violazione di
     test, confermato il fallimento, ripristinato l'originale). Un'unica
     occorrenza residua rilevata nell'HTML delle pagine ("ADMIN MODE — i
     tuoi accessi sono tracciati") è una stringa sitewide pre-esistente
     non-Labs (presente identica anche in homepage), correttamente fuori
     scope per questo guardrail.

- **Fase 1 — audit collisioni**: verificato che nessun articolo esistente
  copra lo stesso intento "formula/definizione efficienza del sonno":
  `tracciare-sonno-anello` (guida d'uso anello), `sleep-tracker-
  comparison-2026` (confronto prodotti), `novita-anello-colmi-sonno`
  (annuncio feature), `metriche-recupero-hrv-sonno-frequenza-cardiaca`
  (pillar recovery, collega HRV+Sleep Efficiency), `hrv-cose-significato-
  valori` (definizione HRV, sorella strutturale). Nessuna cannibalizzazione
  — intento distinto per ciascuna, tutte collegate bidirezionalmente al
  nuovo cluster (verificato da `labs:internal-linking-check`, 42/42 URL).

- **Formule e fonti**: RMSSD (Shaffer & Ginsberg 2017); Sleep Efficiency
  = tempo totale di sonno / tempo a letto × 100 (Reed & Sacco 2016, J Clin
  Sleep Med, PMID 26194727 — ambiguità del denominatore; Buysse et al.
  1989, PSQI; AASM scoring manual 2007). Nessuna soglia clinica presentata
  come universale; wearable vs polisonnografia distinti esplicitamente nei
  Limiti. Verificate live via WebFetch/WebSearch durante lo sviluppo
  originale (non a memoria) — citazioni con anno+PMID/DOI presenti nei
  commenti sorgente (`lib/labs/sleep-efficiency/content.ts`,
  `lib/labs/hrv/content.ts`).

- **JSON-LD**: Labs index → `CollectionPage` + `ItemList` (esattamente i 2
  tool live, nessun tool "in preparazione") + `BreadcrumbList`; calcolatori
  → `WebPage`+`WebApplication` (`applicationCategory: HealthApplication`,
  `isAccessibleForFree: true`, `price: "0"`) + `FAQPage` + `BreadcrumbList`;
  articolo → `BlogPosting` + `FAQPage` (5 domande, identiche fra markup
  visibile e JSON-LD, stessa fonte per costruzione) + `BreadcrumbList`.
  Verificato: zero `MedicalWebPage`/`MedicalEntity`/`Review`/
  `AggregateRating` su nessuna pagina Labs.

- **Route matrix, sitemap, hreflang** (verificati contro server Next
  locale in modalità production, Docker `next start`, non Vercel):
  `/it/labs` e `/en/labs` → 200; entrambi i tool → 200; slug IT sotto EN e
  slug EN sotto IT → 404 (4/4); locale non supportata (13, incluse
  nordiche) → 307 singolo hop verso `/en/labs`, mai una catena;
  `sitemap.xml` contiene esattamente le 6 URL Labs attese (2 index + 4
  tool), hreflang solo it/en/x-default (x-default → en) su tutte.

- **Guardrail (tutti in Docker, tutti exit 0)**: `pnpm install
  --frozen-lockfile`; `tsc --noEmit`; `vitest run` (145/145 — 124 Labs/
  pre-esistenti + 21 pre-esistenti non-Labs, zero test Founder essendo
  `lib/founder/*` escluso); `seo:truth-check`; `labs:truth-check`;
  `ring-watch:claims-check`; `labs:katex-input-check`; `founder:counter-
  check` (pre-esistente, non toccato); oracle Python indipendente (24 HRV
  + 28 Sleep Efficiency validi + 15 vettori d'errore, concordanza 1e-6);
  `labs:formulas-render-check` (10 formule, HTML+MathML, `throwOnError:
  true`); build produzione completa (3650+ pagine); `labs:privacy-check`
  (6/6 combinazioni tool×locale×modalità, CSV letto e verificato
  realmente, zero esfiltrazione); `labs:a11y-check` (4 pagine × 2 motori,
  0 problemi); `labs:cross-browser-check` (4 pagine × Chromium+WebKit ×
  3 viewport, reduced-motion verde dopo il fix Footer.tsx);
  `labs:perf-check` (LCP/CLS/interazione entro target su tutte e 4);
  `labs:internal-linking-check` (42/42 URL); `labs:no-em-dash-check`
  (nuovo, 15 file di contenuto scansionati, 0 em-dash). Screenshot Playwright
  (desktop 1440×900 + mobile 390×844) di Labs index IT/EN e dei 2
  calcolatori, verificati visivamente: layout coerente, card "in
  preparazione" non cliccabile, nessun testo tagliato.

- **Limiti noti**: performance misurata su server Docker locale
  (`next start`), non su edge Vercel reale — proxy ragionevole, non
  sostituisce un audit Lighthouse post-deploy. Il file `docs/seo/labs/
  p11-delivery-report.md` portato as-is descrive ANCHE lo stato Founder
  del branch sorgente (sezione "Incidente Founder trigger") — mantenuto
  per onestà storica/contesto, non riflette lo stato di `main` né lo
  scope di questo sprint. Le altre 13 locale del sito continuano a NON
  avere Labs (per design, fallback 307 verso EN) — nessuna traduzione
  aggiuntiva in questo sprint, come da mandato.

- **Commit**: `fe45338` (ricostruzione Fase 0) + `715c0be` (fix QA: OG
  image, reduced-motion, toolchain) su branch
  `seo/p1-3-labs-sleep-authority`.
- **Zero Preview Deployment**: nessun push, nessuna PR, nessun comando
  Vercel eseguito in questa sessione (`vercel.json` disabilita comunque le
  preview per branch non-`main`, invariato).
- **Stato**: verificato in Docker, tutti i gate verdi. Push e apertura PR
  seguono subito dopo la registrazione di questa riga. Nessun merge
  autonomo.
