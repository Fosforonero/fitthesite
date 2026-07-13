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
