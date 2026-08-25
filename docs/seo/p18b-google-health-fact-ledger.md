# P1.8B — Fact ledger: Google Health / Google Fit / Health Connect / Google Health API / Google Fit APIs / legacy Fitbit Web API

Verificato 25/08/2026. Fonti lette direttamente (WebFetch), non da riassunto. Copre `lib/blog/posts/google-health-google-fit.ts` e, dove pertinente, `lib/blog/posts/google-fit-api-dismissione-2026.ts`.

## Fase 0 — Cannibalizzazione

**Nessuna cannibalizzazione reale.** Mappa di default confermata sui campi `primaryKeyword`/H1/H2 di ciascun file:

| Query/intento | URL |
|---|---|
| Google Health vs Google Fit, migrazione consumer | `google-health-google-fit` |
| Dismissione API Google Fit, migrazione developer | `google-fit-api-dismissione-2026` |
| Pixel Watch e dashboard personale | `dati-pixel-watch-dashboard` |
| Health Connect / Samsung Health (pillar tecnico) | `health-connect-vs-samsung-health` |

`come-funziona-health-connect.ts`, `fitmesh-samsung-health-usarli-insieme.ts` e il pillar `come-funziona-fitmesh.ts` hanno intenti distinti, nessuna sovrapposizione testa-a-testa.

Osservazioni non bloccanti: link `related[]` asimmetrico (google-health-google-fit → google-fit-api-dismissione-2026, non il contrario); `sync-samsung-health-google-fit.ts` (23/05/2026, pre-dismissione Fit) è referenziato da entrambi come "related" ma potrebbe essere parzialmente superato — fuori perimetro di questo sprint, segnalato come possibile freshness-review separata.

## Fase 1 — Ledger (fonti primarie)

Verdict: **corretto** / **incompleto** / **superato** / **falso**.

### A. Redesign Google Health (fonti: support.google.com/googlehealth/answer/17068213, blog.google/.../google-health-app/)

| # | Claim attuale | Verdict | Citazione fonte | Frase corretta | Locale |
|---|---|---|---|---|---|
| A1 | "Fitbit app diventata Google Health dal 19 maggio 2026" | corretto | "Starting May 19, 2026, the Fitbit app will become the Google Health app." | Aggiungere: rollout a finestra, non istantaneo ("your app will update automatically when it's available for your account between May 19th and May 26th") | tutte |
| A2 | "Google inviterà gli utenti Google Fit a migrare entro fine anno" | corretto | "We'll invite Google Fit users to migrate their data into Google Health app later this year." | Nessuna modifica — tempo futuro già corretto | tutte |
| A3 | "Google Fit sta chiudendo/viene ritirato nel 2026" (kicker/meta/tldr/body, presentato come fatto già stabilito) | **incompleto** | Nessuna delle 2 fonti dichiara esplicitamente "shutting down/retired" con data di chiusura ferma — solo l'invito futuro a migrare | Riformulare: rebrand Fitbit→Google Health già avvenuto (19/05); migrazione dati Google Fit ANNUNCIATA per fine 2026, non ancora una chiusura confermata con data | tutte le 11 lingue |
| A4 | Google Health Coach/Gemini, iOS+Android | corretto | Android 11+, iOS 16.4+ | Nessuna modifica | tutte |
| A5 | "coaching Gemini richiede abbonamento Premium" | incompleto | "you'll be offered a 3-month trial of Google Health Premium after you update" | Aggiungere: nuovi utenti/chi torna riceve 3 mesi di prova gratuita | tutte |
| A6 | "Record medici: importa dati da provider compatibili" (senza limite geografico) | incompleto | "In the US, you can sync your medical records..." | Aggiungere limite: funzione oggi solo USA | tutte |
| A7 | "Google Health disponibile su healthapp.google" | incompleto/da verificare | Il dominio non compare in nessuna delle 2 fonti (solo Play Store/App Store) | Rimuovere o verificare separatamente prima di pubblicare | tutte |

### B. Dati di terze parti (fonte: support.google.com/googlehealth/answer/14236613)

| # | Claim attuale | Verdict | Citazione fonte | Frase corretta |
|---|---|---|---|---|
| B1 | FAQ "sincronizza con Strava o Garmin?" — risposta generica, non distingue i due casi | incompleto | "new activities will sync automatically from Google Health to Strava... forward moving... Historical activities will not sync... The Google Health app does not connect directly to Garmin devices." | Garmin: nessun collegamento diretto, passa da Health Connect/Apple Health. Strava: collegamento diretto dedicato, solo nuove attività in avanti (mai storico) |
| B2 | "Google Health legge Health Connect, non viceversa" | **falso** | "Google Health syncs with Health Connect so you can share data between... Google Health is allowed to write the data type... to Health Connect" | Bidirezionale: legge (permesso lettura) E scrive/condivide (permesso scrittura), granulare per tipo di dato — non a senso unico |
| B3 | Tabella comparativa: "Disponibilità API da confermare per terze parti" | incompleto | — | Nessuna API REST pubblica generale, ma collegamento diretto già confermato per Strava; altri wearable via Health Connect/Apple Health |
| B4 | "integra bene soprattutto Fitbit e Pixel Watch... il collegamento comune resta Health Connect" (mai menzionato Apple Health per iOS) | incompleto | "data can be shared... through Health Connect (Android phones) and Apple Health (iPhones)" | Aggiungere Apple Health per gli utenti iOS (l'app è dichiarata disponibile anche su iPhone altrove nell'articolo, mai coerente qui) |
| B5 | Nessuna menzione che i dati terze-parti non alimentano tutte le funzioni | mancante | "we currently use first party data only to calculate your sleep score and Cardio Load" | Aggiungere: anche con HC/Apple Health collegati, Sleep Score e Cardio Load usano OGGI solo dati first-party Fitbit/Pixel |

### C. Health Connect (fonte: support.google.com/googlehealth/answer/14506680)

| # | Claim attuale | Verdict | Citazione fonte | Frase corretta |
|---|---|---|---|---|
| C1 | "Google Health legge Health Connect, non viceversa" (ripetuto, stesso claim di B2) | **falso** | "Once you have connected... you can check data from other apps connected to Health Connect in the Google Health app AND share data from Google Health to those other apps" | Bidirezionale, opt-in per tipo di dato (lettura E scrittura separate) |

### D. Google Health API (fonti: developers.google.com/health/about, /health/migration)

| # | Claim attuale | Verdict | Citazione fonte | Frase corretta |
|---|---|---|---|---|
| D1 | Google Health API = evoluzione Fitbit Web API (in google-fit-api-dismissione-2026.ts; **assente** da google-health-google-fit.ts**) | incompleto | "The Fitbit Web API has been improved and modernized... now called the Google Health API." | Corretto dov'è già scritto; il nuovo articolo consumer deve aggiungere questa entità (vedi tabella 6 entità) |
| D2 | Nessuna data pubblicata per dismissione Fitbit Web API | **incompleto — dato materiale nuovo** | **"In September 2026, the legacy Fitbit Web API will be turned down and will no longer sync data to or from Fitbit users."** | Aggiungere: dismissione Fitbit Web API = **settembre 2026**, data esplicita e diversa da quella delle Google Fit APIs (fine 2026, giorno non pubblicato) — le due dismissioni NON vanno fuse |
| D3 | "Nessun successore unico: HC / Google Health API / Health Services" | corretto | Entrambe le fonti developers.google.com/health parlano solo di Fitbit Web API→Google Health API, mai delle Google Fit APIs | Nessuna modifica |

### E. Google Fit APIs (fonti: developers.google.com/fit, developer.android.com/.../migration/fit/faq)

| # | Claim attuale | Verdict | Citazione fonte | Frase corretta |
|---|---|---|---|---|
| E1 | "Google Fit APIs supportate fino a fine 2026, nessun giorno esatto" | corretto | "will be deprecated in 2026... As of May 1, 2024, developers cannot sign up" / FAQ: "supported until the end of 2026" | Nessuna modifica |
| E2 | "Google Health API sostituisce Fit History/Session API" | incompleto | developer.android.com FAQ: "There is no alternative to the Fit REST API. We encourage... to migrate to the Android Health APIs [Health Connect o Google Health API], see which best fits" | Ammorbidire: non c'è un sostituto 1:1 garantito, solo un invito a valutare Health Connect o Google Health API caso per caso |
| E3 | Tabella: "Disponibilità API da confermare" | **superato** | "[Google Health API] lets you view and manage... data from Fitbit, Pixel Watch, and other third-party devices and apps" | Aggiornare: Google Health API esiste ed è documentata pubblicamente |
| E4 | "Google Fit viene ritirato... Google ufficialmente la ritira" (stesso tema di A3) | incompleto | "Google announced in May 2026 that it will be replaced by the Google Health app by the end of 2026" | Stesso fix di A3: annunciato, non ancora un fatto compiuto con data ferma |
| E5 | Invito migrazione fine anno | corretto | — | Nessuna modifica |
| E6 | Coach/Premium | corretto | — | Nessuna modifica |

**Problemi di fetch** (per trasparenza, nessuno ha impedito la verifica): `support.google.com/googlehealth/answer/14236613` primo tentativo fallito per policy di rete, 3 retry riusciti con contenuto coerente; `developer.android.com/.../migration/fit` (pagina principale) bloccata due volte da policy di verifica dominio — usate con successo le sottopagine `/faq` e `/comparison-guide`, quindi il mapping API-per-API completo non è confermato al 100% sulla pagina principale.

## Fase 2 — Verità FitMesh sulla release pubblica

**Metodologia**: nessuna modifica ai file, `git show`/`git archive` read-only. Release pubblica identificata come tag **`v3.9.8+189`** (il branch corrente `integra/190-lavoro-17-agosto` NON è una release candidate — confermato da [[ramo-190-non-release-candidate]] — nessun tag `v3.9.9+190` esiste).

| Funzione | Stato | Prova |
|---|---|---|
| Health Connect (Android) | **presente** | `health_repository.dart`, `health_connect_origin_source.dart` + bridge Kotlin |
| Apple Health (iOS) | **presente** (lettura + scrittura) | `health_repository.dart`, `healthkit_writer.dart` |
| Samsung Health Data SDK diretto | **presente** | `samsung_health_source.dart` + bridge Kotlin, canale separato da Health Connect |
| Bluetooth diretto (anello Colmi) | **presente** | `colmi_protocol.dart` + moduli ring_*, raggiungibile da UI/nav reale |
| Provenienza per metrica | **presente** | `sources_overview_screen.dart` ("Priorità sorgenti"), raggiungibile da main.dart |
| Dedup e priorità fonti | **presente** | `dedup.dart` (dedupSameSource/suppressEchoes), `steps_origin_policy.dart` (cascata esplicita, mai somma) |
| Cronologia personale | **presente, con limite** | Trend screen: 7/30/90/365 giorni, bucket settimanali oltre 30gg, nessuna vista all-time oltre 1 anno |
| Strava | **presente, lettura E scrittura** | `strava_provider.dart`: read scope attivo di default; write (TCX upload) dietro re-auth esplicita per lo scope aggiuntivo |
| TrainingPeaks | **codice presente, DISATTIVATO in produzione** | `training_peaks_destination.dart` esiste ma `kWiredExportDestinationIds` lo esclude esplicitamente ("intentionally absent from Release 188"); mai invocato da `_sendToDestinations()` |
| Export/write-back | **presente parzialmente** | Attivi: Strava, Intervals.icu, Runalyze, export locale GPX/TCX/KML, export JSON/CSV (Pro-gated). Morti/non wired: Google Drive export (mai invocato), RideWithGPS (stesso gate di TrainingPeaks), formato FIT (non implementato) |
| Lettura diretta Google Health / Google Health API | **assente** | Grep esaustivo su tutto l'albero al tag: zero integrazioni SDK/API. Unico riscontro: mapping cosmetico `com.google.android.apps.fitness`→"Google Fit" per etichettare la provenienza di un dato già dentro Health Connect — non è una chiamata API |

**Discrepanza trovata da correggere nell'articolo attuale**: il testo oggi dice "la scrittura degli allenamenti registrati da FitMesh [verso Strava] è ancora in sviluppo" — ma la scrittura Strava (upload TCX) **è già implementata e raggiungibile** (dietro un passo di re-auth esplicito per il permesso di scrittura, non "in sviluppo"). La frase su TrainingPeaks ("in sviluppo, non ancora disponibile") è invece già corretta e coerente con l'audit.

## Locale — risultato diretto di isBlogVariantIndexable()

Verificato con uno script diagnostico temporaneo (`tools/dump-p18b-locale-status.ts`,
read-only rispetto ai contenuti: importa `isBlogVariantIndexable`/`isPostLocaleComplete`
reali, applica l'overlay nordico clonato prima del check, non scrive nulla — rimosso
prima del commit finale, non incluso nella PR), non da commenti nel file.

| Post | Locale indexable=true | Locale indexable=false (noindex) |
|---|---|---|
| `google-health-google-fit` | it, en, es, de, pt, fr, pl, tr, nl, ja, ko (**11**) | sv, da, no, fi (**4**) |
| `google-fit-api-dismissione-2026` | it, en, es, de, pt, fr, pl, tr, nl, ja, ko (**11**) | sv, da, no, fi (**4**) |
| `dati-pixel-watch-dashboard` (P1.8C, per riferimento) | it, en, es, de, pt, fr, pl, tr, nl, ja, ko, sv, da (**13**) | no, fi (**2**) |

Nessun overlay `nordic-overlay.json` esiste per `google-health-google-fit` o
`google-fit-api-dismissione-2026` (verificato: `applyNordicOverlay` non trova entry
per questi slug) — sv/da/no/fi ricadono sul fallback EN e restano noindex, invariato
rispetto alla baseline. Il conteggio "11" del report finale deriva da questa verifica
diretta, non dal commento nel file sorgente (che va comunque riallineato se stale).

## Confronto con branch storico `content/gsc-google-fit-cluster-fix`

Audit read-only, nessun commit importato (`git show` soltanto, nessun checkout/stash/reset/merge, worktree originale intatto).

- **Ancora valido come ricerca**: la decisione di cannibalizzazione (pagine separate consumer/developer) coincide con la mappa confermata qui. Il pattern di errore che quel branch aveva trovato e corretto — claim di migrazione Google Fit→Health Connect presentata come già completa — era un'ipotesi utile da verificare.
- **Superato**: la data "Fitbit Web API supportata fino a fine 2026, nessun giorno pubblicato" trovata da quel branch (luglio) è ora **superata** dalla fonte aggiornata (settembre 2026 esplicito, vedi D2).
- **Respinto**: il claim specifico che quel branch aveva corretto non è più presente nel testo attuale di `google-health-google-fit.ts` — verificato per grep sul file live, testo già diverso/riscritto indipendentemente in un commit successivo non collegato a quel branch.
- **Nessun commit importato**: slug, redirect, metadata, traduzioni, updatedAt e claim FitMesh restano quelli verificati da zero in questo sprint.
