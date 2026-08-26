# SPRINT P0.15 — OnePlus Health / OHealth: ledger di verità

Data verifica: 2026-08-26. Branch: `hotfix/p015-oneplus-health-truth` (da `origin/main` @ `f8d54c00c1cbe92ee42d64d9a251e2d11693be0e`, che include P0.14). File target: `lib/providers/data.ts` (provider `oneplus-health`, righe ~1920-2600 prima della modifica).

## Metodo

Nessuna fonte secondaria quando esisteva quella ufficiale. Fonti primarie usate (tutte verificate 200 OK il 2026-08-26):

1. `https://www.oneplus.com/us/oneplus-watch-2/specs` — pagina specifiche ufficiale OnePlus Watch 2.
2. `https://developer.android.com/health-and-fitness/health-connect/features/sleep-sessions` — documentazione ufficiale Android Health Connect, `SleepSessionRecord`/`Stage`.
3. `https://developer.android.com/health-and-fitness/health-connect` — documentazione ufficiale Health Connect (requisiti versione).
4. `https://support.google.com/android/answer/12201227?hl=en` — articolo di supporto ufficiale Google su come funziona la sincronizzazione Health Connect.

**Nota metodologica su un rischio di fonte circolare**: alcune risposte sintetizzate da motori di ricerca durante la fase di raccolta contenevano frasi quasi identiche al copy pubblicato sulla landing FitMesh stessa (`fitmesh.fit/en/sync/oneplus-health` compariva nello stesso elenco di risultati). Queste frasi sono state **scartate** come fonte: userle avrebbe significato verificare il claim di FitMesh citando FitMesh. Sono state usate solo le pagine ufficiali sopra, lette direttamente.

Codice FitMesh letto in **due alberi**, entrambi allo stesso commit del wrapper Health Connect (nessuna divergenza rilevante trovata):
- **[LIVE]** = tag `v3.9.8+189` (build pubblica reale sugli store al 2026-08-26).
- **[DEV]** = branch `integra/190-lavoro-17-agosto` (non pubblico, `pubspec.yaml` 3.9.9+190).

## Ledger claim-by-claim

| # | Frase attuale (prima) | Superficie | Fatto osservato | Fonte primaria | Verdetto | Correzione applicata |
|---|---|---|---|---|---|---|
| 1 | "confermato da founder beta su OnePlus Watch nel maggio 2026" (`longDesc`) | 11 locale | Programma Founder **chiuso dal 31/07/2026** (vedi `docs/product/post-founder-entitlement-contract.md:27`); claim di maggio 2026 ormai stale, basato su un solo tester non nominato in modo coerente | Codice interno (git blame `b4361bb`, 22/05/2026: un solo tester "Sandro", nessun modello specificato) | **Falso/stale** | Rimosso. Sostituito con la descrizione del meccanismo generico verificato nel codice pubblico |
| 2 | `longDesc` cita "OnePlus Watch 2/2R" mentre `technicalNotes` cita "OnePlus Watch 2" da solo (contraddizione di modello) | 11 locale | Il commit originario non specifica un modello preciso; FitMesh non ha alcun codice specifico per modello OnePlus | Grep `_friendlyBrandFromPackage` (nessun branch OnePlus) | **Parziale/impreciso** | Generalizzato a "qualsiasi wearable OnePlus" ovunque, coerente col meccanismo reale (generico Health Connect) |
| 3 | FAQ: "FitMesh imports steps, heart rate, **sleep stages**, calories, distance, and workouts" (garantito, non condizionato) | 11 locale | FitMesh **legge davvero** le fasi del sonno da Health Connect quando la fonte le scrive (verificato in `health_repository.dart`, `_buildSleep`/`_SleepSeg`, generico per qualsiasi provider) — **ma** OnePlus non documenta pubblicamente se/quando OHealth scrive `SleepSessionRecord.Stage` (vs. solo il totale) per ogni modello; Android permette di scrivere solo il totale ("Writing sleep stages is optional") | developer.android.com/…/sleep-sessions (Stage opzionale) + `health_repository.dart` (capacità di lettura FitMesh, generica) | **Parziale/non verificabile per il lato OnePlus** | Riformulato in forma condizionale ovunque: "se OHealth scrive anche le fasi, FitMesh le mostra automaticamente" + nota esplicita che OnePlus non documenta la granularità |
| 4 | `setupGuide.syncedData`: "Sonno (durata totale e ora inizio/fine)" — **contraddice** il claim #3 sulla stessa pagina | 11 locale | Stessa causa di #3: due affermazioni opposte (garantita vs. solo totale) nello stesso oggetto provider | — | **Contraddizione interna confermata** | Riformulato in coerenza con #3: "Sonno (durata e orario; le fasi appaiono se OHealth le scrive)" |
| 5 | Nessuna menzione dello storico Health Connect | 11 locale | Health Connect espone ad un'app **appena connessa** solo ~30 giorni dal momento del permesso, non 30 giorni da oggi (eccetto i "health records") | support.google.com/android/answer/12201227 | **Assente, ora divulgato** | Aggiunta una voce ai `requirements` + una nuova Q&A in `troubleshooting` |
| 6 | Nessuna menzione dei requisiti minimi Android/OHealth | 11 locale | OHealth richiede Android 8.0+ e Google Play Services 23.45.23+ (specifico OHealth); Health Connect stesso richiede Android 9 (API 28)+, integrato di sistema da Android 14 | oneplus.com/…/oneplus-watch-2/specs + developer.android.com/…/health-connect | **Assente, ora divulgato** | Aggiunta ai `requirements` (nuovo blocco `editorialTemplateV2`) |
| 7 | Bidirezionalità: **nessun claim esplicito** già presente sulla landing (verificato assente) | 11 locale | FitMesh **ha** un write-back opt-in verso Health Connect (STEPS/SLEEP_ASLEEP totale/HEART_RATE un campione/DISTANCE_DELTA/ACTIVE_ENERGY_BURNED), ma è **rotto (one-shot)**: scrive una volta sola all'attivazione del toggle, mai più nei sync automatici/manuali successivi. Bug identico in LIVE e DEV; mandato di fix interno `INC-HC-WRITE-01.md` (26/08/2026) non ancora implementato, non pubblico | Codice `health_connect_writer.dart` + `docs/sprints/INC-HC-WRITE-01.md` (solo DEV) | **Confermato: nessuna base per un claim di sync bidirezionale** | Nessuna modifica necessaria (il claim non era presente); confermato nel guardrail permanente come categoria vietata |
| 8 | "5–15 minuti" di latenza tipica | 11 locale | Push FCM data-only + WorkManager periodico (min 15 min, default 30, configurabile 15/30/60/120) + debounce foreground 30s — compatibile con "5-15 minuti" come stima, ma il valore "15-360 minuti" usato su un'altra pagina del sito (pixel-watch, fuori scope) **non corrisponde** al codice reale (15/30/60/120) | `background_sync_scheduler.dart` | **Vero (claim OnePlus), nota per debito futuro su altra pagina** | Non toccato (claim esistente già corretto); il nuovo blocco `dataPath.steps` usa la cifra verificata "15, 30, 60 o 120 minuti", non "15-360" |
| 9 | Nessun trattamento vendor-specifico dichiarato (implicito) | — | Confermato: nessun branch di codice per OnePlus in `_friendlyBrandFromPackage`, nessun canale nativo (a differenza di Samsung), solo un hint testuale di onboarding generico | `dashboard_screen.dart` + `_friendlyBrandFromPackage` | **Vero, ora reso esplicito** | Aggiunto ai `limitations`: "FitMesh non ha un riconoscimento dedicato del dispositivo OnePlus" |
| 10 | FAQ #3 "Funziona con OnePlus Watch, OnePlus Watch 2, OnePlus Band" | 11 locale | Vero: nessun codice vendor-specifico, quindi il meccanismo Health Connect funziona identicamente con qualsiasi wearable OnePlus | `_friendlyBrandFromPackage` (assenza di branch OnePlus) | **Vero** | Nessuna modifica (claim già accurato) |

## Verifiche esplicite richieste da FASE 1 (1-12)

1. **Quale app scrive in Health Connect**: OHealth (`com.heytap.health.international`), companion ufficiale OPPO/OnePlus per Watch 2/2R/3/Lite e Band — confermato da oneplus.com/oneplus-watch-2/specs ("OHealth app supports Google Health Connect service"). Un secondo package `com.oneplus.health.international` ("OnePlus Health") esiste su Play Store con descrizione generica; non è stato possibile determinare via fonte ufficiale se sia lo stesso prodotto o un'app legacy separata — **non verificabile**, non usato per correggere claim (il nome "OnePlus Health" nel copy FitMesh è generico/commerciale, non un riferimento di package).
2. **Requisiti Android/versione/permessi**: OHealth = Android 8.0+, GMS 23.45.23+ (fonte ufficiale). Health Connect = Android 9 (API 28)+ standalone, di sistema da Android 14. FitMesh (`minSdk 26`) richiede READ_STEPS/HEART_RATE/RESTING_HEART_RATE/HEART_RATE_VARIABILITY/OXYGEN_SATURATION/TOTAL_CALORIES_BURNED/ACTIVE_CALORIES_BURNED/BASAL_METABOLIC_RATE/DISTANCE/FLOORS_CLIMBED/BODY_TEMPERATURE/SLEEP/EXERCISE/WEIGHT/HEIGHT/RESPIRATORY_RATE.
3. **Direzione del flusso**: OnePlus device → OHealth → Health Connect → FitMesh (lettura). FitMesh ha anche un writer opt-in verso Health Connect, ma è generico (non OnePlus-specifico) e attualmente one-shot/rotto (vedi riga 7 del ledger) — non usato per nessun claim pubblico.
4. **Metriche realmente disponibili**: le 24 `HealthDataType` lette da `health_repository.dart` includono STEPS/HEART_RATE/SLEEP_ASLEEP/SLEEP_REM/SLEEP_DEEP/SLEEP_LIGHT/SLEEP_AWAKE/BLOOD_OXYGEN/ACTIVE_ENERGY_BURNED/DISTANCE_DELTA/ecc. — generico, non filtrato per provider.
5. **Sonno totale vs. fasi**: vedi riga 3/4 del ledger — FitMesh legge entrambi generacamente; OnePlus non documenta quale OHealth scrive per ogni modello.
6. **Storico e limiti**: Health Connect = ~30 giorni dal momento del permesso (non da oggi), eccetto health records; FitMesh non verifica né distingue questo limite dai propri tier commerciali (14/30/90/365 gg) — assenza di codice, non un bug, ma un gap di trasparenza ora colmato nel copy.
7. **Sincronizzazione automatica/manuale**: periodica (15/30/60/120 min a scelta), push FCM data-only, foreground debounce 30s — nessuna differenza LIVE/DEV.
8. **OnePlus Watch vs. Band vs. altri**: nessuna differenza di trattamento nel codice FitMesh; a livello dispositivo, il Watch 2 documenta ufficialmente le fasi del sonno nella propria app nativa (non e' detto che le scriva anche in Health Connect).
9. **Cosa FitMesh legge realmente nella release pubblica**: confermato identico a DEV per tutto cio' che riguarda Health Connect generico.
10. **Cosa FitMesh non legge/non garantisce**: fasi del sonno OnePlus non garantite (dipende da OHealth); nessuna etichetta "OnePlus" dedicata nel dashboard; nessuna verifica di storico Health Connect.
11. **Supporto diretto vs. Health Connect**: nessun supporto diretto, solo Health Connect generico (confermato, nessun canale nativo OnePlus a differenza di Samsung).
12. **Regioni/versioni non documentate**: nessuna versione minima OHealth pubblicamente documentata da OnePlus; nessuna nota di regione trovata nelle fonti ufficiali consultate.

## Prima/dopo (sintesi)

- **Beta/Founder stale**: presente in `longDesc` + `technicalNotes` (11 lingue) → rimosso ovunque.
- **Contraddizione sonno**: FAQ #2 "sleep stages" garantite vs. `syncedData`/`technicalNotes` "solo totale" → riconciliati con formulazione condizionale coerente in tutti i punti (FAQ, syncedData, techNote, technicalNotes, nuovo blocco `limitations`).
- **Bidirezionalità**: mai stata dichiarata → confermato che resta cosi', ora con un divieto esplicito nel guardrail permanente.
- **Storico/requisiti**: assenti → aggiunti (nuovo blocco `requirements` + nuova FAQ troubleshooting).
- **Fonti visibili**: assenti → aggiunto `sourcesBlock` (4 fonti ufficiali, `verifiedOn: "2026-08-26"`), reso visibile in pagina tramite l'adozione di `editorialTemplateV2` (stesso modello già in produzione per wear-os/pixel-watch dalla P1.8C — non un nuovo schema).
- **Corruzioni linguistiche corrette incidentalmente** durante la riscrittura semantica completa di FAQ #1/#2 (non sostituzioni meccaniche): IT "tutti i metriche" → "tutte le metriche" (concordanza); ES "métricos" → "métricas"; PT "os metadados de saúde" → rimosso (termine sbagliato, "metadata" ≠ "metriche di salute"); FR "importerá" (coniugazione spagnola/portoghese intrusa) → "importe"/riscritto; TR "uyumları" (= "le compatibilità", errore di traduzione per "il sonno") → riscritto; NL "FitMeshimporteert" (spazio mancante) → corretto; NL diacritici mancanti ("calorieen", "officiele") → corretti dove toccati da questo sprint.

## Locale corrette vs. rimaste noindex

- **Corrette (11 locale indicizzabili)**: it, en, es, de, pt, fr, pl, tr, nl, ja, ko — tutti i campi toccati da questo sprint riscritti in tutte e 11.
- **Rimaste noindex (4 locale nordiche: sv, da, no, fi)**: nessuna entry esiste per questo provider in queste lingue (gap pre-esistente, non introdotto da P0.15) — **non sbloccate**, nessuna keyword aggiunta, coerente con FASE 4 punto 4 del mandato. La pagina resta generata (per `generateStaticParams` che itera tutte le 15 locale) ma noindex via `isProviderVariantIndexable`, con fallback silenzioso a EN — comportamento pre-esistente e strutturale a tutti i 17 provider, fuori dallo scope di un "truth-hotfix" di contenuto.

## Metadata modificati o invariati

- **Modificati**: `longDesc` (contenuto, non lunghezza-vincolo: EN meta description resta 157/160 char, verificato con `check-bing-seo-recommendations.ts`), `techNote`, `faqs[0].a`, `faqs[1].a`, `setupGuide.syncedData[2]`, `setupGuide.troubleshooting` (+1 Q&A), `setupGuide.technicalNotes`.
- **Invariati**: `slug`, H1 (nessun errore fattuale nell'H1 stesso), `title`/meta description structure (nessuna necessità tecnica o dato GSC/Bing a giustificare un cambio), canonical, hreflang (generato automaticamente da `providerLanguages()`, nessuna modifica di logica), JSON-LD (nessuna data aggiunta: `SoftwareApplication`/`FAQPage`/`HowTo` non hanno mai avuto `dateModified` per nessun provider — scelta di design pre-esistente, non introdotta ne' corretta qui), `dataTypes` (label condivisa "Sonno con fasi"/"Sleep with stages" **non modificata**: è un default `STD_DATA_TYPES` usato da ~15 provider, cambiarlo qui violerebbe il FUORI SCOPE "altri provider"; la capacità e' comunque reale — vedi riga 3 — solo la garanzia per-modello OnePlus specifica era il problema, corretto in prosa).
- **Nuovo**: `sourcesBlock.verifiedOn = "2026-08-26"` (prima campo assente per questo provider, come per tutti i 15 provider senza `editorialTemplateV2`).

## Limiti di questa verifica

- Non è stato possibile confermare via fonte ufficiale OnePlus/OPPO se OHealth scriva effettivamente `SleepSessionRecord.Stage` (vs. solo il totale) per il Watch 2/2R/Band — dichiarato esplicitamente **non verificabile** nel copy corretto, non risolto con un'affermazione in un senso o nell'altro.
- Non è stato possibile determinare se `com.oneplus.health.international` ("OnePlus Health") e `com.heytap.health.international` (OHealth) siano lo stesso prodotto sotto due nomi regionali o due app distinte — irrilevante per i claim corretti (nessuno dipendeva da questa distinzione), segnalato come nota per un futuro sprint se necessario.
- Il bug INC-HC-WRITE-01 (scrittura Android one-shot) è confermato nel codice ma il suo piano di correzione è privato: questo sprint **non lo tocca** (FUORI SCOPE esplicito "modifiche all'app") e lo cita solo come prova a supporto del divieto di claim bidirezionali.

## RETTIFICA MICRO-GATE P0.15-B (26/08/2026)

Una review esterna alla PR #60 ha identificato un **errore fattuale nuovo**, introdotto dal micro-gate P0.15-A dello stesso giorno: la conclusione "OnePlus Watch 2 non ha alcun pulsossimetro" (usata per riportare `dataTypes.spo2.supported` a `false`) è **falsa**. Questa sezione documenta la causa, la correzione e la matrice di verifica più rigorosa (A/B/C/D) applicata a tutte le pill per evitare che lo stesso errore si ripeta su altre metriche.

### La conclusione errata e la sua causa

P0.15-A si basava su un'unica fonte: `https://www.oneplus.com/us/oneplus-watch-2/specs` (pagina di mercato USA), la cui sezione "Sensors" elenca "Accelerometer, gyroscope, optical heart rate sensor, geomagnetic sensor, light sensor, barometer" — **nessun pulsossimetro**. Due fetch separati di quella stessa pagina, in momenti diversi, hanno riprodotto la stessa assenza: non un errore di estrazione dello strumento, ma una pagina di mercato genuinamente incompleta rispetto ad altre pagine dello stesso prodotto:

- `https://www.oneplus.com/global/oneplus-watch-2/specs` elenca esplicitamente **"optical pulse oximeter"** nei Sensors, più "Blood oxygen monitoring: single point, all day" e "Sleep stages (deep, light, REM, waking) ... blood oxygen" nella sezione sonno.
- `https://www.oneplus.com/by/oneplus-watch-2/specs` (la pagina citata dalla review) riporta lo stesso elenco.
- `https://www.oneplus.com/global/oneplus-watch-2` (pagina prodotto) cita "VO2 Max, Heart Rate, and SpO2 (blood oxygen level)".
- Recensioni indipendenti corroborano il sensore fisico: *"The OnePlus Watch 2 does pack an SpO2 sensor, which measured in line with my Apple Watch Ultra 2"* (Android Central, recensione OnePlus Watch 2).

**Lezione**: una dichiarazione di ASSENZA ("il dispositivo non ha X") basata su un'unica pagina regionale ufficiale non è prova sufficiente — richiede una verifica incrociata su almeno un secondo mercato e una fonte indipendente prima di essere pubblicata. `sourcesBlock` ora cita `/global/oneplus-watch-2/specs` al posto di `/us/`.

### Il problema era più ampio: la matrice A/B/C/D

La review ha rilevato che la stessa conflazione logica (il dispositivo misura ⇒ OHealth lo esporta su Health Connect) era già presente nelle altre 5 pill dichiarate "confermate" da P0.15-A (passi, frequenza cardiaca, calorie, distanza, allenamenti): nessuna fonte ufficiale conferma, per NESSUNA metrica specifica, che OHealth la scriva su Health Connect. L'unica conferma ufficiale è generica e non qualificata per metrica: *"OHealth app supports Google Health Connect service"* (oneplus.com/global/specs) e il comunicato OnePlus al MWC 2024 (*"OnePlus Watch 2 and the OHealth app now support Health Connect by Android"*, senza elenco dati).

Per rendere la verifica sistematica e ripetibile, ogni metrica è stata valutata su 4 livelli distinti:

- **A** — il dispositivo la misura (fonte: pagine prodotto/specifiche ufficiali OnePlus).
- **B** — OHealth la mostra nella propria app (fonte: descrizione Play Store, marketing ufficiale).
- **C** — OHealth la SCRIVE su Health Connect (fonte richiesta: annuncio/documentazione ufficiale per QUESTA metrica).
- **D** — FitMesh la legge da Health Connect (fonte: `health_repository.dart`, generico, nessun codice OnePlus-specifico — verificato su v3.9.8+189).

Una pill può dichiararsi sincronizzata OnePlus→FitMesh solo se C e D sono entrambi provati. Risultato: **C non è mai provato per nessuna metrica**.

| Metrica | A (misura) | B (mostra in OHealth) | C (OHealth scrive su HC) | D (FitMesh legge) | Stato pill risultante |
|---|---|---|---|---|---|
| Passi | ✅ oneplus.com | ✅ Play Store ("tracks your daily activities") | ❌ nessuna fonte per metrica | ✅ `STEPS` | conditional |
| Frequenza cardiaca | ✅ oneplus.com (sensore ottico) | ✅ Play Store ("all-day heart rate monitoring") | ❌ nessuna fonte per metrica | ✅ `HEART_RATE` | conditional |
| Sonno (totale) | ✅ oneplus.com | ✅ Play Store ("tracks your sleep") | ❌ nessuna fonte per metrica | ✅ `SLEEP_ASLEEP` | conditional (label pill: "Sonno") |
| Fasi del sonno | ✅ oneplus.com/global/specs ("Sleep stages: deep, light, REM, waking") | ✅ stessa fonte, funzione di prodotto | ❌ nessuna fonte ufficiale (vedi nota terzi sotto) | ✅ `SLEEP_REM/DEEP/LIGHT/AWAKE` se la fonte li scrive | conditional (nessuna label dedicata: "fasi" resta nella prosa, condizionale) |
| Calorie | ✅ oneplus.com | plausibile ("daily activities"), non citata esplicitamente | ❌ nessuna fonte per metrica | ✅ `ACTIVE_ENERGY_BURNED`/`TOTAL_CALORIES_BURNED` | conditional |
| Distanza | ✅ oneplus.com (pagina prodotto OnePlus Health) | — | ❌ nessuna fonte per metrica | ✅ `DISTANCE_DELTA` | conditional (label pill: "Distanza", non più "Distanza & GPS") |
| GPS/percorso allenamento | — nessuna fonte diretta | — | ❌ | ❌ Health Connect Android non ha un tipo dato per la traccia GPS (nessun `ExerciseRoute` letto da FitMesh) | non disponibile in nessun caso — rimosso dalla label, nuova bullet in `limitations` |
| Allenamenti | ✅ oneplus.com ("100+ sports modes", "workout guidance") | ✅ Play Store ("provides workout guidance") | ❌ nessuna fonte per metrica | ✅ `WORKOUT` | conditional |
| SpO₂ | ✅ oneplus.com/global/specs ("optical pulse oximeter", "Blood oxygen monitoring") | ✅ Play Store ("Tracks your SpO2 data") | ❌ nessuna fonte per metrica | ✅ `BLOOD_OXYGEN` | conditional — **rettificato da `false` a `true`+conditional** |
| VO₂ max | ✅ marketing OnePlus Watch 2R / stampa | plausibile (dashboard OHealth cita VO2 Max) | ❌ | ❌ il plugin Flutter "health" 13.1.4 non espone `HealthDataType.VO2_MAX` | non supportato — D fallisce in modo assoluto (limite del motore, non un fatto su OnePlus) |
| Frequenza respiratoria | ✅ marketing OnePlus Watch 3 | — | ❌ | letto genericamente (`RESPIRATORY_RATE`), non è una pill su questo provider | nessuna pill, nessuna modifica |
| HRV | ✅ marketing stress OHealth | — | ❌ | letto genericamente (`HEART_RATE_VARIABILITY_RMSSD`), non è una pill su questo provider | nessuna pill, nessuna modifica |

**Nota su una fonte terza in conflitto**: un vendor commerciale B2B (Sahha.ai, che dichiara un'integrazione tecnica diretta con l'export Health Connect di OHealth) afferma che la categoria "Sleep" esportata da OHealth si limiti a un singolo record `sleep_duration`, senza fasi — un segnale in **conflitto** con l'assenza di prova ufficiale in un senso o nell'altro. Non è una fonte primaria/ufficiale: riportata qui solo per trasparenza, non usata per dichiarare le fasi né presenti né assenti nel copy pubblico.

### Semantica finale delle pill (estensione dati, non solo copy)

- **Verde** (`supported:true`, nessun `status`) = disponibile e confermato dalla fonte ufficiale. Nessuna pill OnePlus è in questo stato: nessuna metrica ha prova "C" ufficiale.
- **Ambra** (`supported:true`, `status:"conditional"`) = FitMesh sa leggerlo da Health Connect se OHealth lo scrive; nessuna fonte pubblica conferma che OHealth lo scriva sempre per questo dispositivo. Si applica a passi, frequenza cardiaca, sonno, calorie, distanza, allenamenti, SpO₂.
- **Grigio** (`supported:false`) = non disponibile in nessun caso. Si applica solo a VO₂ max (limite del plugin "health" 13.1.4, non un fatto su OnePlus).
- Estensione minimale e retrocompatibile sul tipo `Provider`: nuovo campo opzionale `dataTypes[].status?: "conditional"`. Quando assente (il default per gli altri 17 provider), `supported` mantiene il significato binario di sempre — nessuna modifica retroattiva per chi non lo imposta. Il rendering (`page.tsx`, blocco `editorialTemplateV2`) aggiunge un terzo colore (ambra, `#FFB547`) e aggiorna la legenda a tre stati; il blocco legacy (non-V2, usato dagli altri 16 provider) resta identico.

### Locale interessate

Tutte le 11 locale indicizzabili (it, en, es, de, pt, fr, pl, tr, nl, ja, ko): `dataTypes`, `longDesc`, `techNote`, FAQ #2, `setupGuide.syncedData`, `dataPath.steps`, `useCases`, `limitations`, `sourcesBlock` riscritti in tutte e 11 con la stessa logica. Le 4 locale nordiche (sv, da, no, fi) restano noindex, non toccate (invariato da P0.15).

### Limiti residui

- Nessuna fonte ufficiale, per nessuna metrica, conferma il passo "C": non è un limite risolvibile con più ricerca (OnePlus/Heytap non pubblicano un elenco per-metrica dell'export Health Connect) — la pill "conditional" e il testo lo dichiarano esplicitamente, invece di forzare un verdetto assoluto.
- Il segnale del vendor terzo (Sahha.ai) sulle fasi del sonno resta a fonte singola e non verificabile: riportato solo in questo ledger, non usato nel copy pubblico.
- L'esistenza di due package Android per OHealth/"OnePlus Health" (nota già presente nella sezione "Limiti" originale di P0.15) resta non risolta, irrilevante per i claim qui corretti.
- Guardrail aggiornato con 4 nuove regole strutturali/testuali (spo2 rettificata, conditional generalizzato a tutte le pill tranne vo2max, negazione assoluta del sensore SpO2, "fasi non documentate" in senso assoluto) e verificato con 4 negative test reali sul file vero (non stringhe sintetiche), ripristino byte-identico confermato via SHA-256 dopo ciascuno.
