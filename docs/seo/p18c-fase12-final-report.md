# SPRINT P1.8C — Report finale (FASE 12)

Branch: `sprint/p1-8c-pixel-watch-health-api`. HEAD di partenza: `origin/main` @ `b8dc4e1`. Ultimo commit di questo sprint: vedi `git log` in cima al branch al momento della PR. Worktree dedicato: `fitthesite-p18c-pixel/`.

**STOP finale come da mandato: nessun merge, deploy, IndexNow o Validate Fix eseguito. La PR verso `main` e' aperta e in attesa del GO di Matteo.**

## Perimetro toccato

- `/[locale]/sync/pixel-watch`, `/[locale]/sync/wear-os`
- `lib/blog/posts/dati-pixel-watch-dashboard.ts`
- `lib/blog/posts/google-fit-api-dismissione-2026.ts`
- `lib/blog/posts/google-health-google-fit.ts` (solo cover, testo/H1/metadata invariati come da mandato)
- Template condiviso `app/(frontend)/[locale]/(marketing)/sync/[provider]/page.tsx` (usato da tutti i 19 provider)

## Matrice locale indicizzabile (prima = dopo, nessuna variante sbloccata)

| Superficie | Indicizzabili (11) | Non indicizzabili |
|---|---|---|
| `dati-pixel-watch-dashboard` | it,en,es,de,pt,fr,pl,tr,nl,ja,ko | sv,da,no,fi |
| `google-fit-api-dismissione-2026` | it,en,es,de,pt,fr,pl,tr,nl,ja,ko | sv,da,no,fi |
| `/sync/pixel-watch` | it,en,es,de,pt,fr,pl,tr,nl,ja,ko | sv,da,no,fi |
| `/sync/wear-os` | it,en,es,de,pt,fr,pl,tr,nl,ja,ko | sv,da,no,fi |

Confermato via `isProviderVariantIndexable`/`isBlogVariantIndexable` (le funzioni reali) e ora anche via test Vitest permanente (`lib/providers/indexability.test.ts`). Nessuna nuova locale sbloccata: `/sv/sync/pixel-watch` e `/sv/sync/wear-os` restano HTTP 200 con `<meta name="robots" content="noindex, follow">` (verificato live dopo build).

## Fatti prodotto verificati (release pubblica v3.9.8+189)

Fonte completa: `docs/seo/p18c-pixel-watch-wear-os-fact-ledger.md`. Riassunto:

- Percorso dati reale: **Pixel Watch → app companion (Fitbit/Google Health) → Health Connect → FitMesh.** Nessuna integrazione diretta Google Fit/Google Health API nella release pubblica (grep esaustivo, 0 riferimenti a `fit.googleapis.com`/`health.googleapis.com` nel codice tracciato).
- Metriche **lette e mostrate**: passi, frequenza cardiaca, sonno con fasi, HRV (RMSSD, Android), SpO2, distanza, calorie, allenamenti, peso, altezza, frequenza respiratoria, temperatura cutanea.
- Metriche **assenti** (mai lette da Health Connect Android): VO2max, percorso GPS dei workout.
- Latenza onesta: 15-30 minuti tipici, minimo tecnico Android 15 minuti; nessuna fonte sostiene "pochi secondi" o "5 minuti" per il sync automatico.
- Storico leggibile: 30 giorni prima del momento in cui il permesso e' concesso, non 30 giorni da oggi.
- Fitbit Web API legacy: dismessa a **settembre 2026** (solo mese). La Google Health API e' la SUA evoluzione rinominata, non erede delle Google Fit APIs.

## Errori fattuali pubblici corretti (ledger Fase 3, verificati uno per uno)

| # | Errore | Trovato | Corretto |
|---|---|---|---|
| 1 | Pixel Watch limitato a 1/2/3 | Si, `data.ts` + lista wear-os | Si — ora copre 1-5 ovunque |
| 2 | FAQ Pixel contaminate con "Galaxy Watch" | Si, 4 FAQ x 6 locale | Si |
| 3 | "tachicardia" come metrica | Si, `data.ts:943` it | Si — "frequenza cardiaca" |
| 4 | Token corrotto `}};` (variante di `}};;`) | Si, 2 occorrenze PL | Si |
| 5 | "Pixel Zamanlayıcısı" (mistraduzione TR) | Si, 2 occorrenze FAQ | Si |
| 6 | Setup "in 5 minuti" | Si, longDesc + template condiviso | Si — sitewide (bug pre-esistente, non solo pilota) |
| 7 | Dati "entro pochi secondi" | Si, FAQ1, contraddiceva la stessa pagina | Si |
| 8 | "tutti i dati"/"tutte le metriche" | Si, `models.ts` Pixel Watch 2 FAQ | Si |
| 9 | Roadmap "Fitbit Web API Q3 2026" come OAuth pubblico | Si | Si — ora dice dismissione settembre 2026 |
| 10 | Wear OS "non passa da app/cloud terze" | Si, contraddiceva la FAQ stessa | Si |
| 11 | Google Fit "gia' sostituito dal 2025" | Si, senza fonte | Si |
| 12 | "Fitbit Web API" senza distinguere Google Health API | Si, `data.ts` provider | Si |

Trovate ANCHE (Fase 4 del ledger, fuori dalla lista pre-flag): contaminazione KVKK (TR) e RODO (PL) in `dati-pixel-watch-dashboard.ts` (7 punti TR, 2 PL) e in `google-fit-api-dismissione-2026.ts` (4 TR, 1 PL — la menzione RODO legittima su residenza dati UE e' rimasta intoccata); `ctaHref` mancante per 5/11 locale nell'articolo Pixel; entity-fuse ES su Pixel Watch 2 FAQ (`models.ts`).

## Corruzioni linguistiche corrette

Vedi sopra (KVKK/RODO, Pixel Zamanlayıcısı, token `}};`). In aggiunta, durante la traduzione dei nuovi blocchi FASE 5 (9 locale, workflow di traduzione + verifica avversariale indipendente): **0 corruzioni residue**, 1 correzione minore (NL: "workout" anglicismo normalizzato in "trainingen", coerente col resto del testo NL).

## FASE 5 — nuovo modello editoriale (pilota Pixel Watch/Wear OS)

`Provider.editorialTemplateV2` (opt-in esplicito, `undefined` per gli altri 17 provider — **zero impatto verificato**, 559/559 test verdi). Struttura live per i 2 provider pilota:

1. Hero compatto (invariato)
2. **Verdetto** "funziona se... / probabilmente non ti serve se..." (nuovo)
3. **Requisiti** (nuovo)
4. **Percorso dati** (nuovo, sostituisce la vecchia "Nota tecnica" per questi 2 provider — stessa informazione, piu' strutturata, evita duplicazione)
5. Matrice dati supportati (esistente, riposizionato qui solo per i 2 pilota)
6. **Valore concreto / casi d'uso** (nuovo)
7. Screenshot reale — **non popolato**: nessun asset reale fornito in questo sprint, il blocco resta silenzioso (nessun placeholder, nessun mock) — vedi Limiti residui
8. **Limiti onesti** (nuovo)
9. Configurazione (esistente, setupGuide)
10. Troubleshooting (esistente, setupGuide)
11. FAQ (esistente)
12. **Fonti visibili + data di verifica** (nuovo — riusa `<BlogSources>`, stessa logica del blog; include anche il link obbligatorio verso `/fitness-data-sync`, FASE 7 #6)
13. CTA finale (esistente)

**CTA totali per pagina: 3** (hero, dopo-la-matrice, finale) — al limite del massimo richiesto. Il blocco "dopo la matrice" e' platform-aware: `iosDisabled={!platforms.includes("ios")}` nasconde l'App Store sui 2 provider Android-only (verificato live: 3 link Play Store, 2 App Store sulla pagina).

Contenuto IT/EN autorato a mano sul fact ledger; ES/DE/PT/FR/PL/TR/NL/JA/KO tradotti e verificati avversarialmente (Workflow dedicato, attenzione a PL/TR/KO per corruzioni gia' viste, DE/JA priorita' aggiuntiva FASE 6).

## FASE 7 — internal linking (tutti diretti 200, verificato live)

| Collegamento | Stato |
|---|---|
| Articolo Pixel → landing Pixel Watch | Gia' esistente (CTA finale, 11 locale) |
| Landing Pixel Watch → articolo Pixel | Gia' esistente (`relatedBlogSlugs`) |
| Landing Wear OS → articolo Pixel | **Aggiunto** (mancava) |
| Landing Wear OS → guida Health Connect | Gia' esistente |
| Articolo API → pillar Google Health/Fit | Gia' esistente (P1.8B) |
| Pillar → articolo API | Gia' esistente (P1.8B) |
| Landing Pixel/Wear OS → `/fitness-data-sync` | **Aggiunto** (nuovo, nel blocco Fonti) |

Analytics: le 3 CTA store della pagina provider (hero/mid-matrix/finale) ora hanno `ctaLocation` tracciato — **mancava del tutto prima di questo sprint** su tutti e 19 i provider (nuovo in `CTA_PLACEMENTS`: `syncProviderHero`, `syncProviderMidMatrix`, `syncProviderFinalCta`). Nessun dato sanitario/PII nel payload (solo provider/placement/locale/path/store).

## FASE 4 — title/meta dell'articolo API (giustificato da GSC reale)

Dati GSC forniti da Matteo (export ultimi 3 mesi, `/en/blog/google-fit-shutting-down-alternative`): **1.443 impression, 8 click, CTR 0,55%, posizione media 7,94** — confermati esatti nel file fornito. Query dominante: cluster ripetuto "google fit api(s) deprecat(ed/ion) ... health connect ... [2026] official" (decine di varianti, CTR 0%, posizione ~6-10).

- **Title prima:** "Google Fit API deprecation 2026: how to migrate" (57 caratteri renderizzati con il suffisso " · FitMesh")
- **Title dopo:** "Google Fit API Deprecation 2026: Health Connect" (57 caratteri renderizzati) — aggiunge "Health Connect", presente nel cluster query ma assente dal title precedente
- **Description prima:** 226 caratteri (troncava in SERP)
- **Description dopo:** 159 caratteri, stessa promessa fattuale (nessuna data esatta pubblicata)

H1, slug, publishedAt invariati. **Bug trovato e corretto durante il gate**: una prima stesura del nuovo title contava solo la stringa base (57 caratteri) senza il suffisso " · FitMesh" concatenato dal template, arrivando a 67 caratteri renderizzati reali — scoperto in QA browser via `curl` sul `<title>` dopo build, non dedotto. Ora c'e' un guardrail permanente scoped a questi 2 post.

## Immagini — mapping e SHA-256 (invariati dalla FASE 2, verificati identici agli originali)

| Post | File | SHA-256 |
|---|---|---|
| `dati-pixel-watch-dashboard` | `pixel-watch-health-connect-sync.webp` | `abc624f6...aec7875` |
| `google-health-google-fit` | `google-health-multi-source-sync.webp` | `5eb9eccc...286cbd46736` |
| `google-fit-api-dismissione-2026` | `google-fit-api-migration.webp` | `0c4250d1...058cab8e5` |

Tutti e tre identici byte-per-byte agli originali in `~/Downloads` (mai modificati). **Esito gate simbolo Pixel: GO** — il simbolo centrale della cover Pixel e' stato confrontato esplicitamente contro loghi reali in FASE 2 (sessione precedente), tutti i confronti "rischio basso", nessuna somiglianza significativa trovata. Cover map guardrail: 65/65 post con cover esplicita, 22/22 file a 1200x675 esatti, zero duplicati.

## Metriche supportate / non supportate (dichiarate pubblicamente, ora coerenti col codice)

**Supportate:** passi, frequenza cardiaca, sonno con fasi, HRV, SpO2, distanza, calorie, allenamenti, peso, altezza, frequenza respiratoria, temperatura cutanea.
**Non supportate (dichiarato onestamente):** VO2max, percorso GPS dei workout, funzioni calcolate lato Google Health (Health Coach, riepiloghi mensili Pixel Watch 5).

## Fonti lette (aperte direttamente, non da memoria)

- https://blog.google/products-and-platforms/devices/pixel/pixel-watch-5/
- https://support.google.com/googlehealth/answer/14506680?hl=en-GB_ALL
- https://developers.google.com/health/about?hl=en
- https://developer.android.com/health-and-fitness/guides/health-connect
- https://developer.android.com/health-and-fitness/guides/health-connect/plan/data-types
- Codice/manifest release FitMesh `v3.9.8+189` (sola lettura, `git show`/`git ls-tree`, mai checkout)

## Conteggio route statiche/dinamiche e sitemap

`.next/routes-manifest.json` dopo build: **59 route dinamiche** (segmenti parametrizzati), 11 route statiche pure. La baseline del guardrail (`check-vercel-fluid-cpu.ts`) era ferma a 58 da prima di questo sprint (drift pre-esistente causato da `/prova-scaduta`, mai accreditato — **verificato non causato da P1.8C**: `git diff origin/main --name-status` di questo sprint non aggiunge/rimuove nessun `page.tsx`/`route.ts`). Corretta a 59 con nota. Sitemap: **nessun URL nuovo o rimosso** (nessun nuovo slug per mandato) — stesse ~572 righe per pixel-watch/wear-os (incluse varianti modello + hreflang) e ~130 per i due articoli, prima e dopo.

## Test e gate eseguiti

- `tsc --noEmit`: pulito
- `vitest run`: **559/559** verdi (556 pre-esistenti + 3 nuovi in `lib/providers/indexability.test.ts`)
- Guardrail: blog-integrity, translation-corruption, p18b-google-health-truth, p15c-cover-map, p18s-product-led-claims, seo-redirect-integrity, social-metadata, vercel-fluid-cpu — tutti verdi (live, dopo build+start)
- **Nuovo guardrail permanente**: `tools/check-p18c-pixel-wear-os-truth.ts` (12 controlli — vedi intestazione file)
- **Negative test reali**: `tools/verify-p18c-negative-tests.sh`, 6/6 scenari FAIL→ripristino byte-identico→PASS (Galaxy Watch in Pixel, token corrotto, overclaim+tempo assoluto, cover dimensione errata, CTA App Store su Android-only, hreflang verso noindex — quest'ultimo come test Vitest permanente, non bash-injection: la bash-injection non produceva un FAIL osservabile perche' `providerLanguages()` filtra sempre per costruzione, e non esisteva NESSUN test su `lib/providers/indexability.ts` prima di questo sprint)
- Build produzione isolata (`next build`): pulita, exit 0
- `next start` reale + verifica HTTP: 200 diretto su tutte le varianti indicizzabili toccate, 308 singolo-hop sulle varianti EN sotto slug IT, 200+noindex su sv (nessuna nuova locale sbloccata)
- Browser QA (Playwright, **solo Chromium disponibile in questo ambiente — WebKit non testato, limite residuo**): 16 combinazioni URL×locale (pixel-watch, wear-os, 2 articoli × it/en/de/ja) a 320px tutte pulite (zero overflow pagina, tabella con proprio scroll wrapper, parole tedesche fino a 24 caratteri senza rotture), spot-check 390px e desktop puliti, CTA platform-aware confermata live

## Limiti residui

- **Screenshot reale**: nessun asset fornito in questo sprint per pixel-watch/wear-os — il blocco 7 del nuovo template resta silenzioso, non popolato.
- **WebKit**: non testato in questo ambiente (solo Chromium disponibile via Playwright MCP).
- **KVKK/RODO su `google-fit-api-dismissione-2026.ts`**: il nuovo guardrail permanente esclude questo file dal controllo automatico (contiene una menzione legittima di RODO su residenza dati UE — un blanket-check produceva un falso positivo); le correzioni fatte restano protette solo da revisione manuale.
- **Debito trovato ma fuori mandato, non corretto** (nessuna verifica fattuale fatta su questi provider in questa sessione):
  - Token corrotto `}};` identico al bug Pixel/Wear OS, trovato in **4 altri provider** (amazfit-zepp, fitbit, colmi-ring, apple-health — tutti locale PL), tracciato per match esatto nel nuovo guardrail cosi' che una modifica futura a quelle righe richieda un fix vero.
  - Corruzione Unicode (escape a doppio backslash JA/KO) sul pillar `google-health-google-fit.ts` — gia' segnalata nel ledger FASE 4, fuori mandato per questo articolo (solo cover autorizzata).
- **FASE 6 (DE/JA priorita' aggiuntiva)**: coperta dalla verifica avversariale del workflow di traduzione (0 problemi trovati su DE/JA per i nuovi blocchi FASE 5); non e' stata fatta una revisione umana/dedicata separata oltre a questa.
- **FASE 11 (handoff)**: analisi completata e consegnata (`docs/seo/p18c-fase11-next-landings-handoff.md`), ha scoperto debito reale extra-perimetro su `oneplus-health` (overclaim + contraddizione interna sonno-con-fasi + claim "beta founder" non tracciato + corruzioni di traduzione TR/NL/PL/FR) — non corretto, per mandato "analisi-only".

## GO/NO-GO tecnico

**GO tecnico** per il merge, con i limiti residui sopra esplicitamente dichiarati. Tutti i gate automatici passano, zero regressioni misurate (559/559 test, guardrail esistenti + 2 nuovi tutti verdi), browser QA Chromium pulita su tutte le combinazioni verificate, nessuna nuova locale/route sbloccata accidentalmente, CTA entro il limite di 3, nessun em-dash nei testi pubblici nuovi, nessuno schema JSON-LD vietato aggiunto.

## Lista IndexNow (preparata, NON inviata)

- `https://www.fitmesh.fit/it/blog/dati-pixel-watch-dashboard` (+ 9 varianti locale indicizzabili)
- `https://www.fitmesh.fit/it/blog/google-fit-api-dismissione-2026` (+ 9 varianti locale indicizzabili)
- `https://www.fitmesh.fit/it/sync/pixel-watch` (+ 9 varianti locale indicizzabili)
- `https://www.fitmesh.fit/it/sync/wear-os` (+ 9 varianti locale indicizzabili)

**Nessun invio eseguito. Nessun merge, deploy, Validate Fix, modifica Supabase o scrittura in AppFitmesh eseguiti. In attesa del GO esplicito di Matteo.**
