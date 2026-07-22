# Samsung Health / Health Connect / Google Health — Fact Ledger (P1.3M)

Verificato il 2026-07-22. Stati ammessi: `official_verified`,
`code_verified_live`, `code_exists_not_live_verified`, `region_dependent`,
`not_documented`, `unsupported`, `omit`.

Le verità sul codice FitMesh (percorso Samsung Health Data SDK diretto vs
Health Connect, permessi, raggiungibilità UI, metriche lette/non lette) sono
**riprese da un audit già completo e già pubblicato**, non ri-verificate oggi:
`docs/seo/galaxy-watch/fact-ledger.md` (sezione "CORREZIONE ARCHITETTURALE
2026-07-21"), già mergiato in `main` (commit `f49868c`). Perimetro di questa
sessione: nessun tocco ad AppFitmesh, quindi nessuna nuova verifica di codice
oggi — solo riuso di quanto già citato con file:riga.

## Samsung Health Data SDK

| Claim | Fonte | URL/file:riga | Stato | Regione/versione | Testo pubblicabile |
|---|---|---|---|---|---|
| "Samsung Health Data SDK enables access to health data in Samsung Health app. An app using the SDK can access selected health data of the Samsung Health's data store." | Samsung Developer | developer.samsung.com/health/data/overview.html | `official_verified` | — | Sì, come definizione |
| 23 tipi di dato in lettura, 12 in scrittura | Samsung Developer | developer.samsung.com/health/data/overview.html | `official_verified` | — | Sì |
| Requisiti: Android 10 (API 29)+, Samsung Health app 6.30.2+, Java 17+; funziona su "all Samsung smartphones and non-Samsung Android smartphones"; nessun emulatore | Samsung Developer | developer.samsung.com/health/data/overview.html | `official_verified` | — | Sì |
| Serve approvazione partner (package name + firma SHA-256 registrati) prima della produzione; senza approvazione, solo developer mode | Samsung Developer | developer.samsung.com/health/data/process.html | `official_verified` | — | Sì |
| Nessuna menzione di Health Connect nella documentazione SDK (i due sistemi sono documentati separatamente anche da Samsung) | Samsung Developer | developer.samsung.com/health/data/{overview,process}.html | `official_verified` (assenza notata) | — | Sì |

## Health Connect

| Claim | Fonte | URL | Stato | Testo pubblicabile |
|---|---|---|---|---|
| "Health Connect stores and structures health and fitness data... provides standard insert, update, and delete functions... includes functionality that allows client apps to synchronize data out of Health Connect." | Android Developers | developer.android.com/health-and-fitness/health-connect | `official_verified` | Sì |
| Non è una dashboard utente ricca, non menziona esplicitamente Samsung Health o un confronto con SDK proprietari | Android Developers | developer.android.com/health-and-fitness/health-connect | `official_verified` (assenza notata) | Sì, come "non dichiarato", non come negazione assoluta |
| Record type standard: HeartRateRecord, HeartRateVariabilityRmssdRecord, RestingHeartRateRecord, OxygenSaturationRecord, RespiratoryRateRecord, SkinTemperatureRecord, SleepSessionRecord, ExerciseSessionRecord, Vo2MaxRecord, StepsRecord, ActiveCaloriesBurnedRecord, TotalCaloriesBurnedRecord | Android Developers | developer.android.com/health-and-fitness/health-connect/data-types | `official_verified` | Sì — l'esistenza del tipo NON dimostra che Samsung lo scriva per un modello specifico |

## Google Health API (distinta dall'app)

| Claim | Fonte | URL | Stato | Testo pubblicabile |
|---|---|---|---|---|
| Nome esatto "Google Health API"; "view and manage health and fitness metrics and measurement data from Fitbit, Pixel Watch, and other third-party devices and apps... on a unified API infrastructure" | Google Developers | developers.google.com/health | `official_verified` | Sì |
| "The Google Health API is the next generation of the Fitbit Web API... not just a name change" | Google Developers | developers.google.com/health | `official_verified` | Sì |
| Nessuna menzione di Health Connect né di Samsung/Galaxy Watch come fonte dati su questa pagina | Google Developers | developers.google.com/health | `official_verified` (assenza notata) | Sì, come "non dichiarato" |

## Google Health app (distinta dall'API)

| Claim | Fonte | URL | Stato | Testo pubblicabile |
|---|---|---|---|---|
| "connect your third-party device and app to the Google Health app using Health Connect (Android only)" | Google Health Help Center | support.google.com/googlehealth/answer/14236613 | `official_verified` | Sì |
| Per Samsung serve anche il consenso esplicito in Samsung Health: "you must also consent to the processing of health and wellness data in the S Health app to sync your S Health data to Google Health" | Google Health Help Center | support.google.com/googlehealth/answer/14236613 | `official_verified` | Sì |
| "The Google Health app does not connect directly to Samsung Galaxy watches." | Google Health Help Center | support.google.com/googlehealth/answer/14236613 | `official_verified` | Sì, citazione diretta chiave per la sezione entità |

## Matrice ufficiale Health Connect → Google Health (Fase 5)

Fonte: support.google.com/googlehealth/answer/14506680 ("How do I use Health
Connect with the Google Health app?"), tabella "Data types that Google Health
can read"/"...can write", **verificata con fetch grezzo dell'HTML** (non solo
riassunto AI) il 2026-07-22, per lo stesso motivo per cui un fetch riassunto
aveva già causato un errore in un'altra sessione (nome processore Samsung
SW6100 vs SDW6100): qui il riassunto iniziale conteneva un'omissione
materiale, corretta leggendo la tabella grezza.

**Correzione importante rispetto alla lista fornita nel brief**: la lista
"non condivisi" del brief (piani saliti, temperatura cutanea, frequenza
cardiaca a riposo, HRV, frequenza respiratoria) **non corrisponde alla fonte
reale**. La tabella ufficiale li elenca esplicitamente come **letti** da
Google Health. Corretto di conseguenza nell'articolo, non pubblicata la
versione del brief.

| Categoria | Google Health può LEGGERE da Health Connect | Google Health può SCRIVERE su Health Connect |
|---|---|---|
| Fitness | Steps, VO2 max, Floors, Active calories burned, Distance, Exercise, Total calories burned | Steps, Speed, Step cadence, VO2 max, Floors, Distance, Elevation gained, Exercise, Exercise route, Total calories burned |
| Temperature | Body temperature | Body temperature |
| Sleep | Sleep session, Sleep stages | Sleep session, Sleep stages |
| Vitals | Skin temperature, Blood glucose, Heart rate, Heart rate variability, Oxygen saturation, Respiratory rate, Resting heart rate | Skin temperature, Blood glucose, Heart rate, Heart rate variability, Respiratory rate, Resting heart rate |
| Body measurements | Weight, Body fat percentage | Weight, Body fat percentage |
| Nutrition | Hydration, Nutrition (Food, Meal type, Energy, Macros) | Hydration, Nutrition (Food, Meal type, Energy, Macros) |
| Mental wellbeing | Session duration | N/A (solo lettura) |

Stato: `official_verified` per ogni cella sopra (fetch grezzo diretto, non
dedotta). **Assenti dalla tabella in entrambe le direzioni** (verificato
anche con ricerca testuale su tutta la pagina, zero occorrenze): percorsi
GPS/lap split, ECG, notifiche di ritmo irregolare, granularità
minuto/ora — stato `not_documented`, non `unsupported`: la pagina
semplicemente non li menziona, il che non equivale a un'esclusione
dichiarata esplicitamente. Non trasformare questa tabella in una regola
universale per ogni app terza: descrive solo il percorso Health
Connect↔Google Health app documentato da Google, non il comportamento di
FitMesh (verificato separatamente, sezione sotto) né di altre app.

## Galaxy Watch Ultra2/Watch9 (già verificato e pubblicato, riuso)

Specifiche, prezzi, funzioni salute per-modello (Vitals, Heart Health Score,
Daily Cardio Load, Fitness Index, Sleep Apnea, Hearing) già verificati con
fetch grezzo e pubblicati in `lib/blog/posts/galaxy-watch-ultra2-watch9-health-connect.ts`
e nel suo fact-ledger dedicato. Non ri-verificati oggi, riusati con
attribuzione. Stato: `official_verified` (ereditato).

## FitMesh (riuso audit 2026-07-21, non ri-verificato in questa sessione)

| Claim | Stato | Fonte |
|---|---|---|
| Due percorsi paralleli: Samsung Health Data SDK diretto (MethodChannel, `SamsungHealthChannel.kt`) e Health Connect generico | `code_verified_live` | `docs/seo/galaxy-watch/fact-ledger.md`, sezione "CORREZIONE ARCHITETTURALE 2026-07-21" |
| Canale diretto raggiungibile in produzione, non dietro feature flag, entry-point utente in Impostazioni visibile a tutti, shippato da v3.3.0+114 | `code_verified_live` | idem |
| Priorità Samsung su battito/sonno; gap-fill su SpO₂/allenamenti/temperatura cutanea/pressione/composizione corporea; apnea solo come flag booleano | `code_verified_live` | idem |
| VO₂ max esplicitamente escluso dal codice FitMesh (nessun percorso lo legge) | `code_verified_live` | idem |
| Nessun punteggio proprietario Samsung (Heart Health Score, Daily Cardio Load, Fitness Index) replicato da FitMesh | `code_verified_live` | idem |
| Eventuali capacità presenti solo nella futura Build 189 | non applicabile qui: nessuna capacità Samsung/HC risulta legata a Build 189 nell'audit riusato | — |

## Registro fonti lette in questa sessione (P1.3M)

| Fonte | Metodo | Esito |
|---|---|---|
| support.google.com/googlehealth/answer/14506680 | Fetch grezzo HTML (curl + strip tag) | Completato 2026-07-22, ha corretto un'omissione materiale del brief |
| WebSearch di verifica preliminare | WebSearch | Completato 2026-07-22, ha portato alla fonte corretta |
| Tutte le altre fonti Samsung/Android/Google/FitMesh sopra | Riuso di fetch/audit già eseguiti e citati in questa stessa sessione (2026-07-22, sprint P1.3N-C) o nella sessione precedente (2026-07-21, audit FitMesh) | Non ri-fetchate oggi per evitare duplicazione; citazioni invariate |
