# SPRINT P0.15 — OnePlus Health / OHealth: ledger di verità

Data verifica: 2026-08-26. Branch: `hotfix/p015-oneplus-health-truth` (da `origin/main` @ `f8d54c00c1cbe92ee42d64d9a251e2d11693be0e`, che include P0.14). File target: `lib/providers/data.ts` (provider `oneplus-health`).

## VERDETTO FINALE — matrice A/B/C/D (autorevole, aggiornata al MICRO-GATE P0.15-C)

Questa è l'**unica matrice valida**. Le sezioni in "Appendice" più sotto sono cronologia: dove una tabella o un'affermazione lì è in conflitto con questa sezione, è **SUPERSEDED** — marcata esplicitamente dove compare.

### Semantica delle pill

- **Verde** (`supported:true`, nessun `status`) = disponibile e confermato dalla fonte ufficiale. Nessuna pill OnePlus è in questo stato: nessuna metrica ha prova ufficiale del passo "C" (sotto).
- **Ambra** (`supported:true`, `status:"conditional"`) = FitMesh sa leggerlo da Health Connect se OHealth lo scrive; nessuna fonte pubblica conferma che OHealth lo scriva sempre per questo dispositivo. Si applica a: passi, frequenza cardiaca, sonno, calorie, distanza, allenamenti, SpO₂.
- **Grigio** (`supported:false`) = non disponibile in nessun caso. Si applica solo a VO₂ max (limite del plugin Flutter "health" 13.1.4, non un fatto su OnePlus).
- **Accessibilità (MICRO-GATE P0.15-C)**: lo stato non è comunicato solo dal colore. Ogni pill ha un'etichetta di stato visibile e localizzata ("Condizionale"/"Non supportato" nelle 11 locale indicizzabili, nessun fallback EN silenzioso) e un nome accessibile `[metrica] — [stato]` sulla card; il pallino colorato è `aria-hidden`.

### Matrice A (il dispositivo la misura) / B (OHealth la mostra) / C (OHealth la scrive su Health Connect) / D (FitMesh la legge)

Una pill può dichiararsi sincronizzata OnePlus→FitMesh solo se **C e D** sono entrambi provati. Risultato per questo provider: **C non è mai provato per nessuna metrica** — l'unica conferma ufficiale è generica e non qualificata per metrica ("OHealth app supports Google Health Connect service", oneplus.com/global/specs; comunicato OnePlus al MWC 2024).

| Metrica | A (misura) | B (mostra in OHealth) | C (OHealth scrive su HC) | D (FitMesh legge) | Pill risultante |
|---|---|---|---|---|---|
| Passi | ✅ oneplus.com | ✅ Play Store ("tracks your daily activities") | ❌ nessuna fonte per metrica | ✅ `STEPS` | conditional |
| Frequenza cardiaca | ✅ oneplus.com (sensore ottico) | ✅ Play Store ("all-day heart rate monitoring") | ❌ nessuna fonte per metrica | ✅ `HEART_RATE` | conditional |
| Sonno (totale) | ✅ oneplus.com | ✅ Play Store ("tracks your sleep") | ❌ nessuna fonte per metrica | ✅ `SLEEP_ASLEEP` | conditional (label pill: "Sonno") |
| Fasi del sonno | ✅ oneplus.com/global/specs ("Sleep stages: deep, light, REM, waking") | ✅ stessa fonte, funzione di prodotto | ❌ nessuna fonte ufficiale (segnale terzo in conflitto, vedi Appendice D) | ✅ `SLEEP_REM/DEEP/LIGHT/AWAKE` se la fonte li scrive | conditional (nessuna label dedicata: "fasi" resta nella prosa, condizionale) |
| Calorie | ✅ oneplus.com | plausibile ("daily activities"), non citata esplicitamente | ❌ nessuna fonte per metrica | ✅ `ACTIVE_ENERGY_BURNED`/`TOTAL_CALORIES_BURNED` | conditional |
| Distanza | ✅ oneplus.com (pagina prodotto OnePlus Health) | — | ❌ nessuna fonte per metrica | ✅ `DISTANCE_DELTA` | conditional (label pill: "Distanza", **non** "Distanza & GPS") |
| GPS/percorso allenamento | — nessuna fonte diretta | — | ❌ | ❌ Health Connect Android non ha un tipo dato per la traccia GPS (nessun `ExerciseRoute` letto da FitMesh) | **non disponibile in nessun caso** — rimosso dalla label, bullet dedicata in `limitations` |
| Allenamenti | ✅ oneplus.com ("100+ sports modes", "workout guidance") | ✅ Play Store ("provides workout guidance") | ❌ nessuna fonte per metrica | ✅ `WORKOUT` | conditional |
| SpO₂ | ✅ oneplus.com/global/specs ("optical pulse oximeter", "Blood oxygen monitoring") | ✅ Play Store ("Tracks your SpO2 data") | ❌ nessuna fonte per metrica | ✅ `BLOOD_OXYGEN` | conditional |
| VO₂ max | ✅ marketing OnePlus Watch 2R / stampa | plausibile (dashboard OHealth cita VO2 Max) | ❌ | ❌ il plugin Flutter "health" 13.1.4 non espone `HealthDataType.VO2_MAX` | **non supportato** — D fallisce in modo assoluto (limite del motore, non un fatto su OnePlus) |
| Frequenza respiratoria | ✅ marketing OnePlus Watch 3 | — | ❌ | letto genericamente (`RESPIRATORY_RATE`), non è una pill su questo provider | — (nessuna pill) |
| HRV | ✅ marketing stress OHealth | — | ❌ | letto genericamente (`HEART_RATE_VARIABILITY_RMSSD`), non è una pill su questo provider | — (nessuna pill) |

### Fonti primarie (tutte verificate 200 OK)

1. `https://www.oneplus.com/global/oneplus-watch-2/specs` — sensori (incl. pulsossimetro), sonno, requisiti Android/GMS, riga Health Connect. **Sostituisce** `/us/oneplus-watch-2/specs`, la cui sezione Sensors omette il pulsossimetro — vedi Appendice D per la causa dell'errore che questo ha corretto.
2. `https://developer.android.com/health-and-fitness/health-connect/features/sleep-sessions`
3. `https://developer.android.com/health-and-fitness/health-connect`
4. `https://developer.android.com/health-and-fitness/health-connect/read-data`
5. `https://support.google.com/android/answer/12201227?hl=en`

### Estensione dati e guardrail

`dataTypes[].status?: "conditional"` sul tipo `Provider` — additivo, retrocompatibile, assente per gli altri 17 provider (nessuna modifica retroattiva). `page.tsx` (solo blocco `editorialTemplateV2`) aggiunge il terzo colore ambra + la legenda localizzata + il nome accessibile per pill; il blocco legacy (altri 16 provider) è identico a prima. Guardrail (`tools/check-oneplus-health-claims.ts`) verifica strutturalmente: ogni pill `true` tranne vo2max porta `status:"conditional"`; vo2max resta `false`; nessuna negazione assoluta del sensore SpO2; nessuna affermazione assoluta "OnePlus non documenta le fasi"; **nessun consumer pubblico nel repo (scan su `app/`, `components/`, `lib/`) legge `dataTypes`/`.supported` ignorando `.status`** (regola 19, MICRO-GATE P0.15-C).

### Limiti residui

- Nessuna fonte ufficiale, per nessuna metrica, conferma il passo "C": non è un limite risolvibile con più ricerca (OnePlus/Heytap non pubblicano un elenco per-metrica dell'export Health Connect) — la pill "conditional" e il testo lo dichiarano esplicitamente, invece di forzare un verdetto assoluto.
- Il segnale del vendor terzo Sahha.ai sulle fasi del sonno resta a fonte singola e non verificabile: riportato solo in Appendice D, non usato nel copy pubblico.
- L'esistenza di due package Android per OHealth/"OnePlus Health" resta non risolta, irrilevante per i claim qui corretti (vedi Appendice B).
- 4 locale nordiche (sv, da, no, fi) restano noindex, non toccate.

---

## Appendice A — metodo e fonti primarie della verifica originale (P0.15)

Nessuna fonte secondaria quando esisteva quella ufficiale.

**Nota metodologica su un rischio di fonte circolare**: alcune risposte sintetizzate da motori di ricerca durante la fase di raccolta contenevano frasi quasi identiche al copy pubblicato sulla landing FitMesh stessa (`fitmesh.fit/en/sync/oneplus-health` compariva nello stesso elenco di risultati). Queste frasi sono state **scartate** come fonte: userle avrebbe significato verificare il claim di FitMesh citando FitMesh. Sono state usate solo le pagine ufficiali, lette direttamente.

Codice FitMesh letto in **due alberi**, entrambi allo stesso commit del wrapper Health Connect (nessuna divergenza rilevante trovata):
- **[LIVE]** = tag `v3.9.8+189` (build pubblica reale sugli store al 2026-08-26).
- **[DEV]** = branch `integra/190-lavoro-17-agosto` (non pubblico, `pubspec.yaml` 3.9.9+190).

## Appendice B — ledger claim-by-claim originale (P0.15, fondazione ancora valida)

Riguarda founder/beta, contraddizione sonno, storico permesso, requisiti — argomenti **non toccati** dalla rettifica P0.15-B/C, quindi ancora accurati così come scritti.

| # | Frase attuale (prima) | Superficie | Fatto osservato | Fonte primaria | Verdetto | Correzione applicata |
|---|---|---|---|---|---|---|
| 1 | "confermato da founder beta su OnePlus Watch nel maggio 2026" (`longDesc`) | 11 locale | Programma Founder **chiuso dal 31/07/2026** (vedi `docs/product/post-founder-entitlement-contract.md:27`); claim di maggio 2026 ormai stale, basato su un solo tester non nominato in modo coerente | Codice interno (git blame `b4361bb`, 22/05/2026: un solo tester "Sandro", nessun modello specificato) | **Falso/stale** | Rimosso. Sostituito con la descrizione del meccanismo generico verificato nel codice pubblico |
| 2 | `longDesc` cita "OnePlus Watch 2/2R" mentre `technicalNotes` cita "OnePlus Watch 2" da solo (contraddizione di modello) | 11 locale | Il commit originario non specifica un modello preciso; FitMesh non ha alcun codice specifico per modello OnePlus | Grep `_friendlyBrandFromPackage` (nessun branch OnePlus) | **Parziale/impreciso** | Generalizzato a "qualsiasi wearable OnePlus" ovunque, coerente col meccanismo reale (generico Health Connect) |
| 3 | FAQ: "FitMesh imports steps, heart rate, **sleep stages**, calories, distance, and workouts" (garantito, non condizionato) | 11 locale | FitMesh **legge davvero** le fasi del sonno da Health Connect quando la fonte le scrive (verificato in `health_repository.dart`, `_buildSleep`/`_SleepSeg`, generico per qualsiasi provider) — **ma** OnePlus non documenta pubblicamente se/quando OHealth scrive `SleepSessionRecord.Stage` (vs. solo il totale) per ogni modello; Android permette di scrivere solo il totale ("Writing sleep stages is optional") | developer.android.com/…/sleep-sessions (Stage opzionale) + `health_repository.dart` (capacità di lettura FitMesh, generica) | **Parziale/non verificabile per il lato OnePlus** | Riformulato in forma condizionale ovunque: "se OHealth scrive anche le fasi, FitMesh le mostra automaticamente" + nota esplicita che OnePlus non documenta la granularità |
| 4 | `setupGuide.syncedData`: "Sonno (durata totale e ora inizio/fine)" — **contraddice** il claim #3 sulla stessa pagina | 11 locale | Stessa causa di #3: due affermazioni opposte (garantita vs. solo totale) nello stesso oggetto provider | — | **Contraddizione interna confermata** | Riformulato in coerenza con #3: "Sonno (durata e orario; le fasi appaiono se OHealth le scrive)" |
| 5 | Nessuna menzione dello storico Health Connect | 11 locale | Health Connect espone ad un'app **appena connessa** solo ~30 giorni dal momento del permesso, non 30 giorni da oggi (eccetto i "health records") | support.google.com/android/answer/12201227 | **Assente, ora divulgato** | Aggiunta una voce ai `requirements` + una nuova Q&A in `troubleshooting` |
| 6 | Nessuna menzione dei requisiti minimi Android/OHealth | 11 locale | OHealth richiede Android 8.0+ e Google Play Services 23.45.23+ (specifico OHealth); Health Connect stesso richiede Android 9 (API 28)+, integrato di sistema da Android 14 | oneplus.com/…/oneplus-watch-2/specs + developer.android.com/…/health-connect | **Assente, ora divulgato** | Aggiunta ai `requirements` (nuovo blocco `editorialTemplateV2`) |
| 7 | Bidirezionalità: **nessun claim esplicito** già presente sulla landing (verificato assente) | 11 locale | FitMesh **ha** un write-back opt-in verso Health Connect (STEPS/SLEEP_ASLEEP totale/HEART_RATE un campione/DISTANCE_DELTA/ACTIVE_ENERGY_BURNED), ma è **rotto (one-shot)**: scrive una volta sola all'attivazione del toggle, mai più nei sync automatici/manuali successivi. Bug identico in LIVE e DEV; mandato di fix interno `INC-HC-WRITE-01.md` (26/08/2026) non ancora implementato, non pubblico | Codice `health_connect_writer.dart` + `docs/sprints/INC-HC-WRITE-01.md` (solo DEV) | **Confermato: nessuna base per un claim di sync bidirezionale** | Nessuna modifica necessaria (il claim non era presente); confermato nel guardrail permanente come categoria vietata |
| 8 | "5–15 minuti" di latenza tipica | 11 locale | Push FCM data-only + WorkManager periodico (min 15 min, default 30, configurabile 15/30/60/120) + debounce foreground 30s — compatibile con "5-15 minuti" come stima | `background_sync_scheduler.dart` | **Vero** | Non toccato; `dataPath.steps` usa la cifra verificata "15, 30, 60 o 120 minuti" |
| 9 | Nessun trattamento vendor-specifico dichiarato (implicito) | — | Confermato: nessun branch di codice per OnePlus in `_friendlyBrandFromPackage`, nessun canale nativo (a differenza di Samsung) | `dashboard_screen.dart` + `_friendlyBrandFromPackage` | **Vero, ora reso esplicito** | Aggiunto ai `limitations` |
| 10 | FAQ #3 "Funziona con OnePlus Watch, OnePlus Watch 2, OnePlus Band" | 11 locale | Vero: nessun codice vendor-specifico, quindi il meccanismo Health Connect funziona identicamente con qualsiasi wearable OnePlus | `_friendlyBrandFromPackage` (assenza di branch OnePlus) | **Vero** | Nessuna modifica (claim già accurato) |

**Verifiche esplicite FASE 1 (1-12)**, **Prima/dopo (sintesi)**, **Locale corrette vs. rimaste noindex**: contenuto invariato dal P0.15 originale, ancora accurato — non ripetuto qui per brevità; riguardano founder/beta, corruzioni linguistiche, storico permesso, nessuno di questi è stato toccato dalla rettifica P0.15-B/C.

## Appendice C — nota su una riga superata (P0.15, sezione "Metadata")

Il P0.15 originale dichiarava: *"`dataTypes` (label condivisa 'Sonno con fasi'/'Sleep with stages' **non modificata**)... la capacità è comunque reale, solo la garanzia per-modello OnePlus specifica era il problema, corretto in prosa."*

**⚠️ SUPERSEDED**: questo era vero solo per lo scope del P0.15 originale. I micro-gate successivi HANNO modificato `dataTypes` per questo provider: P0.15-A ha introdotto un override locale (label sonno, spo2 riportato — poi rettificato), P0.15-B ha esteso l'override a `status:"conditional"` su quasi tutte le pill, P0.15-C ha aggiunto l'accessibilità. Lo stato attuale di `dataTypes` è descritto **solo** dalla matrice in cima a questo documento.

## Appendice D — cronologia della rettifica P0.15-B (perché l'errore, non lo stato finale)

Una review esterna alla PR #60 ha identificato un errore fattuale introdotto dal micro-gate P0.15-A: la conclusione "OnePlus Watch 2 non ha alcun pulsossimetro" (usata per riportare `dataTypes.spo2.supported` a `false`) era **falsa**. **⚠️ SUPERSEDED dal VERDETTO FINALE in cima** — riportata qui solo come cronologia dell'errore e della lezione appresa.

### La conclusione errata e la sua causa

P0.15-A si basava su un'unica fonte: `https://www.oneplus.com/us/oneplus-watch-2/specs` (pagina di mercato USA), la cui sezione "Sensors" elenca "Accelerometer, gyroscope, optical heart rate sensor, geomagnetic sensor, light sensor, barometer" — **nessun pulsossimetro**. Due fetch separati di quella stessa pagina, in momenti diversi, hanno riprodotto la stessa assenza: non un errore di estrazione dello strumento, ma una pagina di mercato genuinamente incompleta rispetto ad altre pagine dello stesso prodotto:

- `https://www.oneplus.com/global/oneplus-watch-2/specs` elenca esplicitamente **"optical pulse oximeter"** nei Sensors, più "Blood oxygen monitoring: single point, all day" e "Sleep stages (deep, light, REM, waking) ... blood oxygen" nella sezione sonno.
- `https://www.oneplus.com/by/oneplus-watch-2/specs` (la pagina citata dalla review) riporta lo stesso elenco.
- `https://www.oneplus.com/global/oneplus-watch-2` (pagina prodotto) cita "VO2 Max, Heart Rate, and SpO2 (blood oxygen level)".
- Recensioni indipendenti corroborano il sensore fisico: *"The OnePlus Watch 2 does pack an SpO2 sensor, which measured in line with my Apple Watch Ultra 2"* (Android Central, recensione OnePlus Watch 2).

**Lezione**: una dichiarazione di ASSENZA ("il dispositivo non ha X") basata su un'unica pagina regionale ufficiale non è prova sufficiente — richiede una verifica incrociata su almeno un secondo mercato e una fonte indipendente prima di essere pubblicata.

### Il problema era più ampio

La review ha rilevato che la stessa conflazione logica (il dispositivo misura ⇒ OHealth lo esporta su Health Connect) era già presente nelle altre 5 pill dichiarate "confermate" da P0.15-A (passi, frequenza cardiaca, calorie, distanza, allenamenti): nessuna fonte ufficiale conferma, per NESSUNA metrica specifica, che OHealth la scriva su Health Connect. Questo ha portato all'introduzione della matrice A/B/C/D — vedi in cima al documento per la versione finale.

**Nota su una fonte terza in conflitto**: un vendor commerciale B2B (Sahha.ai, che dichiara un'integrazione tecnica diretta con l'export Health Connect di OHealth) afferma che la categoria "Sleep" esportata da OHealth si limiti a un singolo record `sleep_duration`, senza fasi — un segnale in **conflitto** con l'assenza di prova ufficiale in un senso o nell'altro. Non è una fonte primaria/ufficiale: riportata qui solo per trasparenza, non usata per dichiarare le fasi né presenti né assenti nel copy pubblico.

### Guardrail e negative test (P0.15-B)

Guardrail aggiornato con 4 nuove regole strutturali/testuali (spo2 rettificata, conditional generalizzato a tutte le pill tranne vo2max, negazione assoluta del sensore SpO2, "fasi non documentate" in senso assoluto) e verificato con 4 negative test reali sul file vero (non stringhe sintetiche), ripristino byte-identico confermato via SHA-256 dopo ciascuno. Il MICRO-GATE P0.15-C ha aggiunto una quinta regola strutturale (nessun consumer pubblico ignora `status`) con un quinto negative test reale (file consumer temporaneo, rimosso dopo la verifica).

## Appendice E — limiti dichiarati nella verifica originale (P0.15)

- Non è stato possibile confermare via fonte ufficiale OnePlus/OPPO se OHealth scriva effettivamente `SleepSessionRecord.Stage` (vs. solo il totale) per il Watch 2/2R/Band — dichiarato esplicitamente **non verificabile** nel copy corretto, non risolto con un'affermazione in un senso o nell'altro.
- Non è stato possibile determinare se `com.oneplus.health.international` ("OnePlus Health") e `com.heytap.health.international` (OHealth) siano lo stesso prodotto sotto due nomi regionali o due app distinte — irrilevante per i claim corretti.
- Il bug INC-HC-WRITE-01 (scrittura Android one-shot) è confermato nel codice ma il suo piano di correzione è privato: questo sprint **non lo tocca** (FUORI SCOPE esplicito "modifiche all'app") e lo cita solo come prova a supporto del divieto di claim bidirezionali.
