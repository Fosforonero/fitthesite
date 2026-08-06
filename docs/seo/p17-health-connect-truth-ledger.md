# P0 Hotfix — Truth ledger: `health-connect-not-syncing`

Branch: `hotfix/p17-health-connect-truth-fix` (isolato da `origin/main`, nessuna dipendenza da PR aperte).
Data verifica iniziale: 2026-08-05. Data verifica pre-merge (MICRO-ADDENDUM): 2026-08-06. Data ULTIMO CHECK (semantica finestra storica): 2026-08-06. Ogni fonte primaria elencata sotto è stata aperta direttamente in questa sessione (WebFetch), non ricostruita a memoria.

## ULTIMO CHECK pre-GO: semantica finestra storica 30 giorni (2026-08-06)

Il limite dei 30 giorni senza `READ_HEALTH_DATA_HISTORY` **non è una finestra mobile "ultimi 30 giorni da oggi"**: Health Connect impedisce di leggere dati anteriori ai 30 giorni precedenti la PRIMA concessione dei permessi Health Connect all'app. Conseguenze: (a) su una prima autorizzazione recente lo storico disponibile è vicino ai 30 giorni; (b) su un'autorizzazione concessa da mesi possono essere già disponibili molti più giorni; (c) una reinstallazione con nuova concessione reimposta il riferimento; (d) `READ_HEALTH_DATA_HISTORY` (non richiesto da FitMesh) permetterebbe di superare questo limite.

**Verifica eseguita**: la fonte S1 e la risposta FAQ ("recupero dati mancanti") erano già formulate correttamente in tutte le 7 locale live fin dall'hotfix iniziale ("da quando ha ricevuto l'accesso"/"from when it was granted access"/equivalenti). **Trovate e corrette 4 istanze ambigue** (nessun ancoraggio esplicito, leggibili come finestra mobile da oggi): il bullet 5 del TL;DR e il bullet 5 duplicato in "In sintesi", in entrambi i casi per it/en/es/de/nl (file `.ts`) **e** per sv/da (`nordic-overlay.json`, chiave `tldr[4]` e `body.28.items[4]`) — 8 stringhe totali riformulate per ancorare esplicitamente il limite alla prima concessione del permesso, non a una finestra mobile da oggi. Nessuna delle 3 formulazioni esplicitamente bandite ("FitMesh può leggere solo gli ultimi 30 giorni", "Health Connect conserva/condivide soltanto 30 giorni", "la richiesta di 365 giorni restituisce sempre soltanto 30 giorni") era presente nel testo pubblico prima di questa verifica.

Corretta anche la nota del punto 1 (MICRO-ADDENDUM) su `readLatestBiometrics()`: non più classificata come "limitata a 30 giorni" in assoluto, ma come dipendente dalla data della prima autorizzazione FitMesh (vedi sotto).

**Osservazione fuori scope, non toccata in questa verifica**: durante il controllo è emerso che il bullet 3 del TL;DR (it/en/es/de/nl/sv/da) e la relativa voce sv/da in `body.28.items` usano ancora la vecchia dicitura "pipeline Samsung Health → Health Connect" (framing già corretto nel paragrafo Fix-5 del corpo articolo durante l'hotfix iniziale, ma non propagato a questi bullet). Non è un problema di finestra storica: segnalato per una futura pulizia, non è stato modificato ora per restare strettamente nello scope di questa richiesta.

## Fonti primarie aperte e verificate

| # | Fonte | URL | Cosa conferma |
|---|---|---|---|
| S1 | Android Developers — Get started with Health Connect | https://developer.android.com/health-and-fitness/guides/health-connect/develop/get-started | Senza `PERMISSION_READ_HEALTH_DATA_HISTORY`, lettura limitata ai 30 giorni precedenti alla concessione del permesso |
| S2 | Samsung Developers — Health Connect FAQ | https://developer.samsung.com/health/health-connect-faq.html | Orologio→telefono segue una policy propria (batteria); telefono→Health Connect è immediato quando il dato cambia, ma senza SLA garantita |
| S3 | Google Health Help — passaggio da Fitbit | https://support.google.com/googlehealth/answer/17068213 | Rebrand Fitbit→Google Health dal 19/05/2026, rollout fino al 26/05/2026 |
| S4 | Google Android Help — integrazione Health Connect in Android 14 | https://support.google.com/android/answer/14119325 | Da Android 14, Health Connect è un modulo di sistema (Google Play system update), non più un'app standalone da Play Store |
| S5 | Samsung Developers — Accessing Samsung Health Data through Health Connect (blog) | https://developer.samsung.com/health/blog/en/accessing-samsung-health-data-through-health-connect | 3 trigger documentati per il sync watch→app (riconnessione, apertura app, pull-to-refresh) + ritardo intenzionale della FC continua per batteria |
| S6 | Samsung Developers — Managing Sleep Data with Samsung Health and Health Connect (blog) | https://developer.samsung.com/health/blog/en/managing-sleep-data-with-samsung-health-and-health-connect | Il sonno viene elaborato solo alla riconnessione, con ritardo aggiuntivo legato a "processor availability" |

## MICRO-ADDENDUM pre-merge (2026-08-06): evidenze di chiusura

### Punto 1 — permessi sulla build reale (non solo grep sorgente)

Verifica forense approfondita read-only su AppFitmesh (workflow dedicato, agente separato, 44 tool call, 362s). Sintesi:

**READ_HEALTH_DATA_HISTORY** — verdetto **confermato**, con evidenza molto più forte del grep iniziale:
- Non dichiarato nel manifest sorgente dell'app (`flutter_app/android/app/src/main/AndroidManifest.xml`).
- Non dichiarato nel manifest del plugin Flutter `health` 13.1.4 (`~/.pub-cache/hosted/pub.dev/health-13.1.4/android/src/main/AndroidManifest.xml`), che è **vuoto** — quindi non è un permesso che potrebbe arrivare "in silenzio" da una dipendenza, l'assenza è sotto il controllo diretto del progetto.
- **Assente anche nel merged manifest reale** prodotto da una build Gradle precedente (`flutter_app/build/app/intermediates/merged_manifest/release/processReleaseMainManifest/AndroidManifest.xml`, build v186, 10/07).
- **Assente nel dump `aapt2 dump permissions`** di un APK realmente compilato presente nel repo (`FitMesh-B2-coordinator-48eb5453.apk`, versionCode 189, versionName 3.9.8, package `com.fitmeshsync.app`).
- Non richiesto a runtime nel codice: i metodi del plugin che lo esporrebbero (`isHealthDataHistoryAvailable()`, `requestHealthDataHistoryAuthorization()`, ecc.) esistono nella libreria ma non sono mai chiamati da FitMesh.
- **Nuova sfumatura trovata** (non presente nella nota precedente, non inverte il verdetto): `HealthRepository.readLatestBiometrics()` richiede un intervallo di 365 giorni per WEIGHT/HEIGHT. **Correzione di semantica (ULTIMO CHECK pre-GO, 2026-08-06)**: senza il permesso esteso, Health Connect non applica una finestra mobile "ultimi 30 giorni da oggi" — impedisce di leggere dati anteriori ai 30 giorni precedenti alla PRIMA concessione dei permessi Health Connect a FitMesh. Quindi la porzione effettivamente accessibile da `readLatestBiometrics()` dipende da quando l'utente ha autorizzato FitMesh la prima volta: su un'autorizzazione recente lo storico reale sarà vicino ai 30 giorni; su un'autorizzazione concessa da mesi potrebbero essere già disponibili molti più giorni dei 30 richiesti come minimo; una disinstallazione/reinstallazione con nuova concessione reimposta il riferimento. Non è quindi corretto classificare la lettura come "limitata a 30 giorni" in assoluto. Gap funzionale reale (senza READ_HEALTH_DATA_HISTORY il caso "prima autorizzazione recente" resta comunque sotto ai 365 giorni richiesti dal codice), non documentato altrove, segnalato a Matteo ma **non pubblicato nell'articolo** (non cambia il verdetto sull'istruzione utente, che resta falsa se dicesse di concedere un permesso che l'app non richiede).

**READ_HEALTH_DATA_IN_BACKGROUND** — confermato **dichiarato, richiesto a runtime, e usato realmente** (non solo dichiarato "morto"): la gestione del rifiuto esiste esplicitamente (outcome dedicato `skip:bgPermNotGranted` in `background_sync.dart`, per non mascherare la causa come genericamente "nessun dato"). Nessuna modifica necessaria: l'articolo non fa affermazioni su questo permesso che richiedano correzione.

Verdetto invariato: **confermato**, non cambiato dalla verifica più approfondita. Nessuna modifica a ledger/articolo/guardrail richiesta dal criterio "solo se cambia il verdetto" — questa sezione documenta la verifica più solida, non un cambio di conclusione. Dettaglio completo (merged manifest excerpt, dump aapt2, limiti) nel journal del workflow.

### Punto 2 — Samsung Health: da causa unica a causa possibile

Ricerca dedicata (WebFetch su 4 pagine ufficiali Samsung, non forum terze parti) ha confermato che "orologio→telefono" **non è l'unico collo di bottiglia documentato**. Samsung documenta esplicitamente 3 trigger per il sync watch→app (riconnessione, apertura app Samsung Health, pull-to-refresh) più variazioni per tipo di dato (FC continua ritardata per batteria, sonno elaborato solo alla riconnessione). Il paragrafo "Fix 3" è stato riformulato in it/en/es/de/nl per riflettere questi trigger multipli invece di presentare la riconnessione come causa dimostrata unica, aggiungendo 2 nuove fonti (S5, S6) alla citazione inline e a `sources[]`. La scrittura Samsung Health→Health Connect resta descritta come "di norma rapida" ma **non garantita**, mai "sempre immediata".

## Tabella claim → verdetto → correzione

| Claim originale | Verdetto | Correzione applicata | Locale corrette (testo .ts, live) | Comportamento Android generico | Comportamento FitMesh reale |
|---|---|---|---|---|---|
| "Il recupero storico è automatico" | FALSO (assoluto non supportato) | Riformulato "NON è automatico", condizionato ad app sorgente + permesso storico | it/en/es/de/pt/fr/pl/tr/nl/ja/ko | Health Connect non retro-scrive da solo: dipende dall'app sorgente | FitMesh legge quello che l'app sorgente ha scritto, non triggera un backfill |
| "Concedi il permesso di lettura storica in FitMesh" (framing azionabile, ~24 occorrenze) | FALSO PER QUESTA APP | Rimosso come istruzione azionabile; il fatto dei 30gg resta SOLO nei passaggi esplicativi (TL;DR punto 5, "In sintesi" punto 5, FAQ) | it/en/es/de/pt/fr/pl/tr/nl/ja/ko | Il permesso esiste a livello Health Connect/Android | AndroidManifest FitMesh (letto in sola lettura) NON dichiara `READ_HEALTH_DATA_HISTORY` in nessun file `.dart` o manifest: dirlo come step utente sarebbe azionabile-ma-falso |
| "Samsung Health sincronizza in tempo reale con Health Connect" (framing generico, 2 sezioni: Fix 3 e Fix 5) | IMPRECISO | Corretto: il collo di bottiglia è orologio→telefono (policy batteria Samsung), non la scrittura telefono→Health Connect (quella è immediata) | it/en/es/de/nl (+ pt/fr/pl/tr/ja/ko per coerenza testuale, non indicizzate oggi) | — | — |
| "Fix 5: pipeline dedicata separata Samsung Health→Health Connect" | IMPRECISO | Riformulato: "va autorizzata separatamente dai permessi generali dell'app", non più descritta come pipeline/canale a sé | tutte le 11 locale presenti nel file | — | — |
| Riferimenti a "Fitbit" come app corrente | OBSOLETO dal 19/05/2026 | Aggiornato a "Google Health (ex Fitbit), dal 19 maggio 2026" con fonte inline | tutte le 11 locale presenti nel file | — | — |
| "Da Android 14+ Health Connect si aggiorna dal Play Store" (percorso UI implicito nelle istruzioni cache/aggiornamento) | OBSOLETO SU ANDROID 14+ | Aggiunta diramazione esplicita: Android 13- via Play Store, Android 14+ via Impostazioni→Sistema→Aggiornamento di sistema Google Play | it/en/es/de/nl (+ altre per coerenza) | — | — |
| "L'ottimizzazione batteria è la causa numero uno... risolve la maggioranza dei casi" | ASSOLUTO NON SUPPORTATO (nessuna fonte per la percentuale/rango implicito) | Ammorbidito a "una causa frequente... spesso risolve il problema" | it/en/es/de/nl | — | — |
| 4 corruzioni testuali TR ("Health Connect"→"KVKK", incl. un artefatto template non risolto) | BUG DI TESTO (non un claim, ma comprometteva la leggibilità del claim) | Ripristinato "Health Connect" letterale nelle 4 occorrenze | tr | — | — |
| 2 intestazioni "Fix 2" corrotte (PL/TR, testo misto/garbled) | BUG DI TESTO | Riscritte in polacco/turco corretto | pl, tr | — | — |
| 1 corruzione testuale PL aggiuntiva ("Moż},'d powtarzać się", "Największość") trovata in questa sessione | BUG DI TESTO | Corretto a "Mogą powodować duplikaty... Większość aplikacji..." | pl | — | — |
| Statistiche inventate "90%"/"~60%" (solo overlay nordico sv/da, non nel testo IT/EN canonico) | NUMERI NON DOCUMENTATI | Rimosse da `nordic-overlay.json` (25/25 righe diff, verificato) | sv, da | — | — |
| Articolo senza `sources[]` né citazioni visibili | GAP (richiesto da FASE 1/2) | Aggiunto `sources: string[]` (4 URL S1-S4, alimenta `citation` in JSON-LD) + citazioni inline "Fonte:/Source:/Fuente:/Quelle:/Bron:" ancorate al claim specifico, in it/en/es/de/nl | it/en/es/de/nl | — | — |

## Locale realmente live oggi (confermato via `isBlogVariantIndexable` + `isPostTranslated`, non "11" come riportato erroneamente in una sintesi precedente in questa stessa sessione)

**7 locale indicizzate**: it, en, es, de, nl (testo `.ts`) + sv, da (nordic overlay).
**6 locale bloccate** (causa condivisa: `secondaryKeywords` 5 elementi invece di 6 richiesti, non toccata da questo hotfix): pt, fr, pl, tr, ja, ko.
**2 locale senza overlay per questo post** (non bloccate da un bug, semplicemente mai tradotte lì): no, fi.

Le correzioni di testo sono state comunque propagate anche a pt/fr/pl/tr/ja/ko per non lasciare una versione "vecchia e falsa" in sorgente in attesa dello sblocco futuro (FASE 3 di questo addendum: PT/FR in PR separata, sul testo CORRETTO, non sul draft precedente).

### Punto 3 — Matrice di verifica live sulle 7 locale

Costruita rifacendo il build produzione completo (verificato `.next/prerender-manifest.json` presente, il primo tentativo era stato interrotto a metà da un timeout del tool e va scartato) + `next start` locale + HTTP reale su tutte le 7 varianti.

| Locale | Nessun residuo assoluto (real-time/causa-unica/%) | Fonte inline (6/6 URL) | Lingua corretta (no fallback EN) | FAQ visibile = 4 Question in JSON-LD | dateModified |
|---|---|---|---|---|---|
| it | ✅ | ✅ 6/6 | ✅ | ✅ | 2026-08-06 |
| en | ✅ | ✅ 6/6 | ✅ | ✅ | 2026-08-06 |
| es | ✅ | ✅ 6/6 | ✅ | ✅ | 2026-08-06 |
| de | ✅ | ✅ 6/6 | ✅ | ✅ | 2026-08-06 |
| nl | ✅ | ✅ 6/6 | ✅ | ✅ | 2026-08-06 |
| sv | ✅ (fix applicato durante questa verifica, vedi sotto) | ✅ 6/6 | ✅ | ✅ | 2026-08-06 |
| da | ✅ (fix applicato durante questa verifica, vedi sotto) | ✅ 6/6 | ✅ | ✅ | 2026-08-06 |

**Bug trovato dalla matrice stessa**: sv/da sono locale live tramite `nordic-overlay.json`, non tramite il file `.ts` — la riscrittura Samsung Health del punto 2 era stata applicata solo al `.ts` (it/en/es/de/nl), lasciando sv/da con la vecchia formulazione a causa singola ("flaskhalsen är inte själva skrivningen... utan steget innan"). Corretto in `nordic-overlay.json` con traduzioni fedeli svedese/danese dello stesso testo multi-causa, verificato `isPostTranslated` ancora `true` per entrambe, aggiunto un guardrail dedicato (check 10) che scansiona anche l'overlay, non solo il file `.ts`.

`dateModified: 2026-08-06` è corretto per tutte le 7 (non un falso "cambiato ovunque"): il contenuto è stato modificato oggi in tutte e 7, sia nel file `.ts` (it/en/es/de/nl) sia nell'overlay (sv/da).

Note su PT/FR non ancora sbloccate: `isBlogVariantIndexable(post, "pl")` e `isBlogVariantIndexable(post, "tr")` verificati `false` (invariati) — vedi sezione dedicata sotto.

## PL/TR: riparazioni non pubblicate (MICRO-ADDENDUM punto 4)

Le due correzioni di corruzione testuale in polacco e turco elencate in tabella (4 occorrenze "KVKK"→"Health Connect" in TR, 2 intestazioni "Fix 2" riscritte PL/TR, 1 correzione aggiuntiva PL "Moż},'d powtarzać się"→"Mogą powodować duplikaty") sono **riparazioni di bug di testo pre-esistenti nel sorgente**, non un'attivazione di nuovo contenuto. Distinzione esplicita:

- PL e TR **restano bloccate per l'indicizzazione** dalla stessa causa condivisa di pt/fr/ja/ko (`secondaryKeywords` 5/6 elementi) — questo hotfix non tocca quel gate.
- `isBlogVariantIndexable(post, "pl")` e `isBlogVariantIndexable(post, "tr")` restano `false` prima e dopo questo hotfix (nessuna modifica al meccanismo di indicizzazione).
- Le stringhe PL/TR corrette esistono nel sorgente `.ts` (quindi in git, in questa PR) ma **non sono servite pubblicamente**: nessuna pagina `/pl/blog/health-connect-not-syncing` o `/tr/blog/health-connect-not-syncing` è raggiungibile in produzione oggi, non compaiono in `sitemap.xml`, non hanno `hreflang` in uscita dalle pagine indicizzate.
- Motivazione della riparazione comunque eseguita: un bug di corruzione testuale (non un claim fattuale) lasciato nel sorgente sarebbe stato ereditato tale e quale dalla futura PR di sblocco PL/TR, propagando il difetto invece di limitarsi a spostare il problema piu' avanti.

## Limiti ancora non verificabili

- Comportamento esatto di Garmin Connect per tipo di dato/versione app: nessuna documentazione ufficiale Garmin pubblica trovata con lo stesso livello di dettaglio di Android/Samsung/Google; il testo riflette questo mantenendo un linguaggio non assoluto ("varia... non è garantito, ma nemmeno escluso").
- Il claim CTA "log visibile in-app di cosa si è sincronizzato e cosa no" (segnalato dal fact-check come non riscontrato altrove nel repo) resta INVARIATO in questo hotfix, in attesa di conferma di Matteo — non è stato né rimosso né usato per giustificare nuovo testo.
