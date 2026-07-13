# SEO Results Log

> Log dati, non narrazione. Ogni riga registra UNA iniziativa/URL con il suo
> stato attuale nella convenzione a 6 stati (vedi
> [seo-geo-master-plan.md](./seo-geo-master-plan.md), sezione 3). Non
> inventare risultati non ancora misurati: se una riga non ha ancora dati
> 14/28/90 giorni, il campo resta vuoto/`—`, non una stima.

## Convenzione di stato

`rilevato` → `corretto localmente` → `in preview` → `deployato` →
`validato post-deploy` → `risultato misurato`.

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
- **Stato 2026-07-13 (prima del deploy di questo sprint)**: **corretto
  localmente** — verificato in Fase 4 di questo sprint con build/server
  locale (canonical, hreflang it/en/de/es/x-default, redirect 308 a singolo
  hop, JSON-LD WebPage+FAQPage+BreadcrumbList, robots indicizzabile). Non
  ancora deployato in produzione.

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
- **Commit**: `00b53d3`, `417a816`, `de6c5cf`, `070ad87`.
- **Stato**: **corretto localmente**, portato nel branch di questo sprint,
  non ancora deployato (fa parte dei 13 commit da `origin/main` a HEAD del
  worktree `fitthesite-article-duplicates`).

### Fix Bing 2026-07-13

- **Cosa**: 2 title EN oltre 70 caratteri
  (`esportare-dati-fitbit-google`, `esportare-dati-garmin`); 7 meta
  description provider fuori range 150-160 caratteri (`suunto` EN, `oura`
  EN, `galaxy-watch` EN, `oneplus-health` EN, `withings` JA,
  `smartphone-android` EN, `amazfit-zepp` EN); 1 noindex accidentale
  (`health-connect-not-syncing` variante NL); warning domain-level backlink
  Bing (off-site, non un bug tecnico, non "corretto" con link artificiali).
- **Commit**: `5dfa31b`.
- **Verifica di questo sprint (Fase 2)**: `tools/check-bing-seo-recommendations.ts`
  verde (`2 title ≤70c, 7 meta description 150-160c, variante NL
  indicizzabile`). Verifica diretta aggiuntiva su server locale: NL
  `health-connect-synchroniseert-niet` → 200, nessun tag `robots noindex`
  (assenza = index,follow, confermato per contrasto con una pagina
  genuinamente noindex), canonical self-referencing corretto, presente in
  sitemap.xml con proprio `<loc>` + hreflang alternates, contenuto body
  NL genuinamente tradotto (non fallback EN, verificato via
  `isBlogVariantIndexable`/`isPostLocaleComplete`, che richiede OGNI campo
  tradotto in NL).
- **Stato**: **corretto localmente**, non ancora deployato.

### Nuovo articolo duplicate fitness data (IT/EN)

- **Cosa**: riscrittura dell'articolo esistente
  `piu-smartwatch-insieme-dati-doppi` (IT, slug storico mantenuto) +
  `multiple-smartwatches-duplicate-data` (EN) — corregge l'assunto
  precedente "Health Connect non deduplica" con la distinzione reale tra
  deduplicazione dei totali aggregati (Attività/Sonno, via priorità
  sorgenti) e allenamenti/record grezzi (richiedono diagnosi separata,
  spesso da loop di sincronizzazione).
- **Commit**: `9bbc52b`. Scritto da Codex in worktree separato — non
  modificato da Claude in questo sprint (vincolo esplicito).
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
- **Stato**: **corretto localmente** (già verificato dall'autore Codex nel
  proprio worktree, ri-verificato indipendentemente da Claude in questo
  sprint), non ancora deployato.

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
- **Commit**: non ancora committato al momento della stesura di questa riga
  (verrà committato in Fase 6 come commit dedicato ai fix di verità di
  questo sprint, separato dal commit del piano SEO/GEO).
- **Verifica**: `tools/check-llms-consistency.ts` verde prima e dopo ogni
  modifica (verificato con rerun dopo ciascuna correzione, non solo alla
  fine).
- **Stato**: **corretto localmente**, non ancora deployato.

## Sezioni da compilare dopo il deploy (Fase 7-9)

Le colonne sotto restano vuote finché non esistono dati reali — non
compilare in anticipo:

| Iniziativa | Commit produzione | Timestamp deploy | URL live verificato | Status code | Canonical | Robots | Sitemap | IndexNow | Controllo 14gg | Controllo 28gg | Controllo 90gg |
|---|---|---|---|---|---|---|---|---|---|---|---|
| P0.2 fitness-data-sync | — | — | — | — | — | — | — | — | 2026-07-27 | 2026-08-10 | 2026-10-11 |
| Fix Bing | — | — | — | — | — | — | — | — | 2026-07-27 | 2026-08-10 | 2026-10-11 |
| Nuovo articolo duplicate data | — | — | — | — | — | — | — | — | 2026-07-27 | 2026-08-10 | 2026-10-11 |
| Audit truth-review P0.3 | — | — | — | — | — | — | — | — | 2026-07-27 | 2026-08-10 | 2026-10-11 |

## Decision log

Vedi [seo-geo-master-plan.md](./seo-geo-master-plan.md) sezione 10 per il
formato. Le tre decisioni di questo sprint sono registrate lì; il verdetto
(keep/iterate/revert/inconclusive) va aggiunto QUI come nuova riga dopo il
controllo dei 14 giorni (2026-07-27), non anticipato.
