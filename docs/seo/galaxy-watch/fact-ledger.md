# Galaxy Watch Unpacked — Fact Ledger (P1.3N)

## RISOLUZIONE POST-EVENTO (P1.3N-C, 2026-07-22)

Samsung ha confermato Galaxy Watch Ultra2 e Galaxy Watch9 il 22/07/2026.
Tutte le righe `reported_not_confirmed` sotto (nome prodotto, specifiche
hardware, prezzi) sono state verificate contro il comunicato ufficiale
Samsung Newsroom (fetch diretto, incrociato con lettura del sorgente
HTML grezzo per i valori numerici, dopo che un primo fetch AI-riassunto
aveva trascritto erroneamente il nome del processore come "SW6100"
anziché il corretto "Qualcomm SDW6100") e integrate nell'articolo
pubblicato: `lib/blog/posts/galaxy-watch-ultra2-watch9-health-connect.ts`.
Il resto di questo ledger (sotto) è il registro storico di verifica
pre-evento, conservato per tracciabilità: non riscritto riga per riga,
ma ogni fatto rilevante è stato ri-verificato oggi contro le fonti live
prima della pubblicazione, non semplicemente promosso da
`reported_not_confirmed` a `confirmed_by_samsung` per assunzione.

Sprint P1.3N, Fase 1. Scritto il 2026-07-21 (giorno prima di Galaxy
Unpacked, 2026-07-22 14:00 BST / 15:00 CEST, Londra). Ogni claim ha:
testo, stato, fonte, data/ora di verifica, decisione editoriale, nota
geografica se pertinente.

Stati ammessi: `confirmed_by_samsung`, `confirmed_platform_only`,
`reported_not_confirmed`, `false_or_unsupported`.

**Da rifare interamente dopo l'evento**: questo ledger va riverificato
riga per riga contro le pagine Samsung live (Newsroom, prodotto, specifiche,
Support) subito dopo Unpacked — nessun claim `reported_not_confirmed` può
diventare `confirmed_by_samsung` senza una nuova verifica live (Fase 2/15).

---

## Evento

| Claim | Stato | Fonte | Verificato | Decisione editoriale | Nota geo |
|---|---|---|---|---|---|
| Data/ora evento: 22/07/2026, 14:00 BST / 15:00 CEST, Londra | `confirmed_by_samsung` | Samsung (conferma ufficiale data+sede, ripresa da [SamMobile](https://www.sammobile.com/news/samsung-galaxy-unpacked-event-july-22-2026-z-flip-fold-8/), [GSMArena](https://www.gsmarena.com/samsung_confirms_galaxy_unpacked_event_for_july_22_wide_foldable_expected-news-73621.php)) | 2026-07-21 | Usabile nell'articolo come fatto | — |
| Teaser ufficiale: tagline "A New Shape Unfolds", focus dichiarato su foldable | `confirmed_by_samsung` | Teaser Samsung (via [Engadget](https://www.engadget.com/2215055/how-to-watch-samsungs-july-2026-galaxy-unpacked-event/)) | 2026-07-21 | Non centrale per l'articolo (riguarda i foldable, non il Watch) — non citare come prova di feature Watch | — |
| Nome "Galaxy Watch Ultra 2" e/o "Galaxy Watch 9" | `reported_not_confirmed` | Stampa tech pre-evento ([Android Authority](https://www.androidauthority.com/samsung-galaxy-unpacked-july-2026-what-to-expect-3688548/), [SamMobile](https://www.sammobile.com/news/samsung-galaxy-unpacked-event-july-22-2026-z-flip-fold-8/)) | 2026-07-21 | **Non usare in URL/title/body finché Samsung non conferma il nome esatto** (Fase 2) | — |

## Funzioni Samsung Health già annunciate ufficialmente (pre-Unpacked)

**Aggiornamento 2026-07-21 (preflight P1.3N-B, pass fonti ufficiali)**: il
fetch diretto dell'URL Newsroom globale originale continua a dare timeout
(5° tentativo consecutivo, stesso esito della sessione precedente) — ma
oggi ho recuperato lo **stesso identico comunicato** via due mirror
ufficiali Samsung alternativi, entrambi raggiunti con successo:
[Samsung Newsroom UK](https://news.samsung.com/uk/samsung-introduces-next-gen-galaxy-watch-features-for-ai-powered-everyday-health-companion)
e [Samsung New Zealand](https://www.samsung.com/nz/news/local/samsung-introduces-next-gen-galaxy-watch-features-for-ai-powered-everyday-health-companion/),
entrambi domini Samsung ufficiali. Stato di tutte le righe sotto
**aggiornato da `confirmed_by_samsung (via triangolazione)` a
`confirmed_by_samsung (fetch diretto)`**, con citazioni verbatim.
Pubblicato 2026-06-04 (coerente con la data GSMArena già nota).

| Claim | Stato | Fonte | Verificato | Decisione editoriale | Nota geo |
|---|---|---|---|---|---|
| **Vitals**: analizza 5 segnali notturni ("heart rate, heart rate variability, respiratory rate, skin temperature and blood oxygen") rispetto alla "true resting baseline", notifica solo su deviazioni significative | `confirmed_by_samsung` (fetch diretto) | Samsung Newsroom UK + NZ (verbatim identico) | 2026-07-21 | Usabile in Fase 6.4; **non dire che diagnostica infezioni o malattie** (Fase 4/6) | — |
| **Heart Health Score**: "takes the insights previously found in Vascular Load — such as sleep, stress and activity — and combines them with body composition data" | `confirmed_by_samsung` (fetch diretto) | Samsung Newsroom UK + NZ | 2026-07-21 | Usabile in Fase 6.7; punteggio proprietario, non esportabile 1:1. **Nota**: il mirror NZ lo chiama "Heart Score" (non "Heart Health Score") — discrepanza minore tra mirror regionali dello stesso comunicato, verificare quale nome useranno le fonti post-evento | — |
| **Daily Cardio Load**: "measures accumulated cardiovascular strain. By calculating daily load and maximum training capacity, it recommends optimal training targets and rest times" | `confirmed_by_samsung` (fetch diretto) | Samsung Newsroom UK + NZ | 2026-07-21 | Usabile in Fase 6.5; distinguere dato grezzo (HR) da punteggio Samsung | — |
| **Fitness Index**: "analysing metrics like heart rate, VO2 max (a key measure of aerobic fitness) and daily steps against users' peers" | `confirmed_by_samsung` (fetch diretto, VO2 max confermato come input esplicito, non più solo triangolato) | Samsung Newsroom UK + NZ | 2026-07-21 | Usabile in Fase 6.6; **non affermare che FitMesh importi il Fitness Index o il VO2 max che lo alimenta** (VO2 max non è comunque letto da FitMesh via Health Connect, vedi sezione FitMesh sotto) | — |
| **AGEs Index**: "enhanced to quietly work in the background, capturing automatic overnight measurements" | `confirmed_by_samsung` (fetch diretto) | Samsung Newsroom UK + NZ | 2026-07-21 | Usabile in Fase 6.7; **non presentare come diagnosi o previsione certa dell'invecchiamento** (Fase 6) | — |
| **Antioxidant Index** (NUOVO, non presente nella versione precedente di questo ledger): "significantly advancing" con "new trend charts and daily history logs"; nessun meccanismo di misurazione dettagliato nella fonte | `confirmed_by_samsung` (fetch diretto) | Samsung Newsroom UK + NZ | 2026-07-21 | Punteggio/indice proprietario Samsung Health, stesso trattamento degli altri (non esportabile, non letto da FitMesh) | — |
| **Hearing Health** (NUOVO): "monitoring surrounding ambient noise through Galaxy Watch, it delivers personalised analytics to help protect the user's ears" | `confirmed_by_samsung` (fetch diretto) | Samsung Newsroom UK + NZ | 2026-07-21 | **Attenzione**: un riassunto WebSearch (non la fonte primaria) affermava un'integrazione con Galaxy Buds — **NON confermato dal testo verbatim della fonte primaria**, che cita solo il Watch. Non scrivere il claim Galaxy Buds nell'articolo: non sourciato | — |
| Disclaimer wellness-only ufficiale | `confirmed_by_samsung` (fetch diretto) | Samsung Newsroom UK: "New health features are for wellness only, not for the diagnosis or treatment of any medical condition." — Samsung Newsroom NZ (versione più estesa): "New health features are for wellness only, not for the prevention, diagnosis, monitoring, alleviating, treatment, curing, or compensation of any injury, ailment, deformity, disorder, or adverse condition." | 2026-07-21 | Usare la formulazione NZ (più completa) nel disclaimer editoriale se serve una citazione diretta; entrambe le versioni sono ufficiali Samsung, la discrepanza è tra mirror regionali dello stesso comunicato | — |
| Le nuove funzioni saranno disponibili PRIMA sul "the upcoming Galaxy Watch" (nessuna designazione di generazione specifica nella fonte) | `confirmed_by_samsung` (fetch diretto) | Samsung Newsroom UK + NZ | 2026-07-21 | Fatto centrale per l'angolo editoriale. **La fonte non nomina "Ultra 2" né alcun nome commerciale**: continua a valere il gate Fase 2 | — |
| App Samsung Health riorganizzata in 5 aree: Sleep, Activity, Nutrition, Mindfulness, Vitals | `confirmed_by_samsung` (via triangolazione precedente, non ri-verificato oggi nei due mirror) | Samsung Newsroom (triangolato, sessione precedente) | 2026-07-21 | Contesto, non centrale | — |

## Teaser Samsung Newsroom Italia (fetch diretto, NUOVO oggi)

Fonte: [Samsung Newsroom Italia — "In arrivo un nuovo alleato per il
benessere al polso, potenziato dall'AI"](https://news.samsung.com/it/in-arrivo-un-nuovo-alleato-per-il-benessere-al-polso-potenziato-dallai),
pubblicato 14-07-2026, fetch diretto riuscito (a differenza delle 2 URL
globali equivalenti, che continuano a dare timeout).

| Claim | Stato | Fonte | Verificato | Decisione editoriale | Nota geo |
|---|---|---|---|---|---|
| Conferma "il prossimo Watch" in arrivo (non nominato) | `confirmed_by_samsung` (fetch diretto) | Samsung Newsroom IT | 2026-07-21 | Usabile: nuovo Watch confermato, nome ancora ignoto | — |
| "Componenti interni completamente nuovi" senza specificarli | `confirmed_by_samsung` (fetch diretto, ma il claim stesso è vago per natura) | Samsung Newsroom IT | 2026-07-21 | Usabile SOLO in forma altrettanto vaga ("componenti rinnovati", nessuna specifica) — non dedurre chip/CPU/GPU da questo | — |
| "Maggiore autonomia" senza mAh o giorni specifici | `confirmed_by_samsung` (fetch diretto) | Samsung Newsroom IT | 2026-07-21 | Usabile come "autonomia migliorata (dichiarazione generica Samsung)", MAI con un numero | — |
| "Monitorare la salute più a lungo" + "con maggiore precisione" (claim di precisione attribuito a Samsung) | `confirmed_by_samsung` (fetch diretto) | Samsung Newsroom IT | 2026-07-21 | Usabile, attribuito esplicitamente a Samsung ("Samsung dichiara maggiore precisione"), mai come fatto verificato indipendentemente da FitMesh | — |
| Evento Unpacked confermato: 22/07/2026, 14:00 BST | `confirmed_by_samsung` (fetch diretto, ri-conferma indipendente della data già nota da fonti secondarie) | Samsung Newsroom IT | 2026-07-21 | Usabile come fatto | — |
| Nessun disclaimer medico/wellness-only in questo specifico comunicato (teaser generico, diverso dal comunicato funzioni salute dettagliato sopra) | `confirmed_platform_only` (assenza notata, non un'omissione anomala: è un teaser, non l'annuncio funzioni) | Samsung Newsroom IT | 2026-07-21 | Non citare questa pagina come fonte del disclaimer: usare il comunicato funzioni salute sopra per quello | — |

**Nota metodologica ulteriore**: le 2 URL globali richieste esplicitamente
oggi (`samsung-introduces-next-gen-galaxy-watch-features...` e
`coming-soon-a-new-ai-powered-health-companion-on-your-wrist`) e l'URL
di invito Unpacked (`invitation-galaxy-unpacked-july-2026...`) hanno
dato timeout ripetuto (2 tentativi ciascuna). Per la prima ho comunque
ottenuto contenuto equivalente via i due mirror UK/NZ sopra. Per il
teaser "coming soon" globale e per l'invito Unpacked non ho un fetch
diretto riuscito della URL esatta indicata, ma ho copertura equivalente
dei fatti rilevanti (data evento, claim vaghi su hardware) via il mirror
IT sopra, un dominio Samsung ufficiale diverso ma dello stesso tipo di
comunicato. Da ritentare le URL esatte prima della pubblicazione finale.

## Specifiche hardware (tutte da NON pubblicare prima della conferma, Fase 4)

| Claim | Stato | Fonte | Verificato | Decisione editoriale | Nota geo |
|---|---|---|---|---|---|
| Batteria 800 mAh | `reported_not_confirmed` | Rumor pre-evento (varie fonti tech) | 2026-07-21 | **Bloccato**, non pubblicare senza conferma Samsung (Fase 4) | — |
| Autonomia reale 3-4 giorni | `reported_not_confirmed` | Rumor pre-evento | 2026-07-21 | **Bloccato** — anche se confermata capacità nominale, l'autonomia reale resta "non ancora testata" finché FitMesh non ha il device | — |
| Display 5.000 nit | `reported_not_confirmed` | Rumor pre-evento | 2026-07-21 | **Bloccato** | — |
| Spessore 10,6 mm | `reported_not_confirmed` | Rumor pre-evento | 2026-07-21 | **Bloccato** | — |
| Riduzione 12% (spessore/peso) | `reported_not_confirmed` | Rumor pre-evento | 2026-07-21 | **Bloccato** | — |
| IP69K | `reported_not_confirmed` | Rumor pre-evento | 2026-07-21 | **Bloccato** | — |
| 10 ATM | `reported_not_confirmed` | Rumor pre-evento | 2026-07-21 | **Bloccato** | — |
| 64 GB storage | `reported_not_confirmed` | Rumor pre-evento | 2026-07-21 | **Bloccato** | — |
| Variante Bluetooth-only | `reported_not_confirmed` | Rumor pre-evento | 2026-07-21 | **Bloccato** | — |
| 5G | `reported_not_confirmed` | Rumor pre-evento | 2026-07-21 | **Bloccato** | — |
| Prezzo 749 € | `reported_not_confirmed` | Rumor pre-evento | 2026-07-21 | **Bloccato** | — |
| Snapdragon Wear Elite sul nuovo Watch | `reported_not_confirmed` | Qualcomm conferma il chip esiste per la piattaforma Wear OS, **non** che Samsung lo adotti su questo modello — attribuzione al Watch da NON fare senza conferma Samsung esplicita (regola Fase 3) | 2026-07-21 | **Bloccato** finché Samsung non lo conferma esplicitamente per QUESTO modello | — |
| Incrementi CPU/GPU applicati al Watch | `reported_not_confirmed` | Rumor pre-evento, spesso dedotto dal chip Qualcomm senza conferma Samsung | 2026-07-21 | **Bloccato** | — |
| Modelli 40mm/44mm, display 438×438 / 480×480 (Watch 9) | `reported_not_confirmed` | Stampa tech pre-evento (Android Authority) | 2026-07-21 | **Bloccato** | — |

## Fatti piattaforma (Health Connect, indipendenti dall'evento)

Fonte primaria: [Android Developers — Health Connect data types](https://developer.android.com/health-and-fitness/health-connect/data-types),
verificato via fetch diretto 2026-07-21.

| Claim | Stato | Fonte | Verificato | Decisione editoriale | Nota geo |
|---|---|---|---|---|---|
| Health Connect espone i record type: HeartRateRecord, HeartRateVariabilityRmssdRecord, RestingHeartRateRecord, OxygenSaturationRecord, RespiratoryRateRecord, SkinTemperatureRecord, SleepSessionRecord, ExerciseSessionRecord, Vo2MaxRecord, StepsRecord, ActiveCaloriesBurnedRecord, TotalCaloriesBurnedRecord | `confirmed_platform_only` | Android Developers (Google, non Samsung) | 2026-07-21 | Regola fondamentale Fase 7: l'esistenza del record type NON dimostra che Samsung lo scriva — usare `unknown/not documented` per la colonna "Samsung dichiara export?" finché non trovata una fonte Samsung esplicita | — |

Ri-verificato oggi (fetch diretto, [developer.android.com/health-and-fitness/health-connect](https://developer.android.com/health-and-fitness/health-connect)),
definizione ufficiale generale: "Health Connect stores and structures
health and fitness data... provides standard insert, update, and delete
functions for recorded data... includes functionality that allows
client apps to synchronize data out of Health Connect." La pagina
**non** menziona esplicitamente Samsung Health né fa un confronto
diretto con SDK proprietari di produttori — conferma solo il ruolo di
piattaforma di interoperabilità generica, coerente con quanto già noto.

## Samsung Health Data SDK — documentazione ufficiale (NUOVO, fetch diretto 2026-07-21)

Fonti: [developer.samsung.com/health/data/overview.html](https://developer.samsung.com/health/data/overview.html),
[developer.samsung.com/health/data/process.html](https://developer.samsung.com/health/data/process.html).
Questa è la documentazione ufficiale del **secondo percorso**, distinto
da Health Connect, che FitMesh usa per leggere dati Samsung Health
direttamente (vedi sezione "Verità FitMesh" sotto per il codice).

| Claim | Stato | Fonte | Verificato | Decisione editoriale | Nota geo |
|---|---|---|---|---|---|
| Definizione ufficiale: "Samsung Health Data SDK enables access to health data in Samsung Health app. An app using the SDK can access selected health data of the Samsung Health's data store." | `confirmed_by_samsung` (fetch diretto, documentazione sviluppatori) | developer.samsung.com/health/data/overview.html | 2026-07-21 | Base per la Fase 5 (sezione "non sono la stessa cosa") | — |
| Requisiti: Android 10 (API 29)+, Samsung Health app 6.30.2+, Java 17+; funziona su "all Samsung smartphones and non-Samsung Android smartphones" (nessun emulatore) | `confirmed_by_samsung` (fetch diretto) | developer.samsung.com/health/data/overview.html | 2026-07-21 | Conferma: non è un'esclusiva hardware Samsung, richiede solo l'app Samsung Health installata (coerente col codice, vedi Q3 audit sotto) | — |
| Lettura: 24+ tipi di dato supportati in lettura, inclusi activity summary, blood glucose, blood oxygen, blood pressure, body composition, exercise, heart rate, nutrition, skin temperature, sleep, steps, user profile | `confirmed_by_samsung` (fetch diretto) | developer.samsung.com/health/data/overview.html | 2026-07-21 | Conferma teorica: **disponibilità nell'SDK non equivale a supporto FitMesh**, vedi matrice codice sotto per cosa FitMesh richiede/legge davvero | — |
| Scrittura: 12 tipi di dato in scrittura (blood glucose, blood oxygen, blood pressure, body composition, body temperature, exercise, floors climbed, heart rate, nutrition, sleep, water intake) | `confirmed_by_samsung` (fetch diretto) | developer.samsung.com/health/data/overview.html | 2026-07-21 | FitMesh non usa la scrittura (permesso manifest è READ-only, vedi audit codice) — non citare capacità di scrittura come se FitMesh le usasse | — |
| Pagina overview: nessuna menzione di Health Connect | `confirmed_by_samsung` (assenza notata) | developer.samsung.com/health/data/overview.html | 2026-07-21 | I due sistemi sono documentati separatamente da Samsung stessa: rafforza la Fase 5 (non sono la stessa cosa, nemmeno per Samsung) | — |
| Processo di produzione: "Please submit partner request before your app distribution." Dopo approvazione, "the app's information including the app package name and signature (SHA-256)...will be registered in the Samsung Health's system". Senza approvazione, "the app... works only with the developer mode turned on" | `confirmed_by_samsung` (fetch diretto, risponde alla domanda 10 dell'audit codice sotto: SÌ, serve partnership + package name + firma SHA-256 registrata) | developer.samsung.com/health/data/process.html | 2026-07-21 | Fatto rilevante per la sezione Fase 5: l'accesso diretto non è "libero", richiede approvazione Samsung per-app. FitMesh risulta già approvato (vedi `FLUTTER_MIGRATION_ROADMAP.md:434-441` nell'audit codice) | — |
| Pagina process: nessuna menzione di Health Connect | `confirmed_by_samsung` (assenza notata) | developer.samsung.com/health/data/process.html | 2026-07-21 | Ulteriore conferma: i due percorsi (SDK diretto vs Health Connect) hanno processi di onboarding completamente separati e non collegati nella documentazione Samsung | — |

## Google Health API — documentazione ufficiale (NUOVO, fetch diretto 2026-07-21)

Fonte: [developers.google.com/health](https://developers.google.com/health).

| Claim | Stato | Fonte | Verificato | Decisione editoriale | Nota geo |
|---|---|---|---|---|---|
| Nome esatto: "Google Health API". Definizione: permette di "view and manage health and fitness metrics and measurement data from Fitbit, Pixel Watch, and other third-party devices and apps — all on a unified API infrastructure" | `confirmed_platform_only` (fonte Google, non Samsung) | developers.google.com/health | 2026-07-21 | Base per Fase 5: nome ufficiale esatto da usare ("Google Health API"), non "Google Health" generico quando si parla dell'API | — |
| "The Google Health API is the next generation of the Fitbit Web API... not just a name change. It's the Fitbit Web API evolved into a more stable, consistent, and scalable foundation" | `confirmed_platform_only` | developers.google.com/health | 2026-07-21 | Conferma diretta: è l'evoluzione della Fitbit Web API, come richiesto in Fase 4/5 | — |
| Nessuna menzione di Health Connect in questa pagina | `confirmed_platform_only` (assenza notata) | developers.google.com/health | 2026-07-21 | **Non dedurre** una relazione esplicita tra Google Health API e Health Connect dalla fonte: Samsung/Google non le collegano esplicitamente qui. L'articolo deve dire "non dichiarano relazione esplicita", non inventarne una | — |
| Nessuna menzione di ingestion automatica da Galaxy Watch o altri device Samsung; fonti dati citate esplicitamente: "Fitbit, Pixel Watch, and other third-party devices and apps" (generico, nessun brand Samsung nominato) | `confirmed_platform_only` (assenza notata) | developers.google.com/health | 2026-07-21 | **Blocca esplicitamente** il claim vietato "Google Health API riceve automaticamente dati Galaxy Watch": non sourciato, anzi la fonte non nomina Samsung affatto | — |
| Nessuna menzione su questa pagina di un'app consumer "Google Health" distinta dall'API | `confirmed_platform_only` (assenza notata, pagina è developer-facing) | developers.google.com/health | 2026-07-21 | La distinzione app-vs-API va sourciata dall'articolo sorella già pubblicato (`lib/blog/posts/google-health-google-fit.ts`), non da questa pagina che copre solo l'API | — |

**Nota importante**: non ho trovato nel repo (verificato oggi via
`grep` su tutto l'albero sorgente) una URL "pagina ufficiale Google
Health app già usata nel truth layer del sito" come indicato nel brief
— l'articolo `google-health-google-fit.ts` cita fatti (lancio 19 maggio
2026, evoluzione dell'app Fitbit, tier "Google Health Coach" con
Gemini) ma senza un URL letterale incorporato nel file. Ho usato quei
fatti già pubblicati come riferimento per la distinzione app/API, senza
inventare una URL. Se esiste una URL specifica da usare, va fornita.

## Verità FitMesh (codice reale, Fase 8) — verificato 2026-07-21

Fonte: `AppFitmesh/flutter_app`, file/linee citate. Percorso HC = Health
Connect generico (nessuna integrazione diretta Galaxy Watch — la stessa
pipeline vale per qualunque sorgente che scriva in Health Connect).

| Metrica | Stato codice | Citazione |
|---|---|---|
| HeartRateRecord | letto | `health_repository.dart:159,1637-1651` |
| HeartRateVariabilityRmssdRecord | letto | `health_repository.dart:161,1676-1681` |
| RestingHeartRateRecord | letto | `health_repository.dart:160,1652-1655` |
| OxygenSaturationRecord | letto | `health_repository.dart:162,1656-1668` |
| RespiratoryRateRecord | letto | `health_repository.dart:182,1707-1716` |
| **SkinTemperatureRecord** | **NON letto** — il plugin mappa `HealthDataType.BODY_TEMPERATURE` su `BodyTemperatureRecord` (tipo HC diverso), che FitMesh legge e archivia come `skinTemperatureC`: un'etichettatura interna fuorviante, non il vero record dedicato | `health_repository.dart:1688-1691`; plugin `HealthConstants.kt:79`; permesso reale è `READ_BODY_TEMPERATURE` (manifest `:79`, array `:22`), non `READ_SKIN_TEMPERATURE` (assente ovunque) |
| SleepSessionRecord | letto | `health_repository.dart:169-173,1279,1876` |
| ExerciseSessionRecord | letto | `health_repository.dart:179,1891,2139`; plugin `HealthConstants.kt:97` |
| **Vo2MaxRecord** | **Esplicitamente escluso** — commenti di esclusione espliciti, snapshot HC imposta sempre `vo2Max: null` | `health_permissions.xml:24-25`; `AndroidManifest.xml:81-83`; `health_repository.dart:175,1934-1939` (`:1940` per il null) |
| StepsRecord | letto | `health_repository.dart:158,1787-1790` |
| ActiveCaloriesBurnedRecord / TotalCaloriesBurnedRecord | letto | `health_repository.dart:163-164,1795-1801,1802-1807` |

**Nessun gate di promozione per-metrica**: non esiste un
`product_status.dart`/`capability*.dart` equivalente lato Flutter — solo
`lib/core/feature_flags.dart` (gate a livello di intera sezione prodotto:
Mesh Famiglia, Gamification, Gym), non per singola metrica HC. La UI ha
un meccanismo di disclosure (`_MissingMetric`/`_missingMetricWhy` in
`dashboard_screen.dart:9546-9604`) che spiega all'utente perché una
metrica può mancare — non un gate di build.

**Nessuna integrazione diretta Galaxy Watch**: zero branching sul nome
del device nel percorso Health Connect (lettura generica via
`getHealthDataFromTypes`). Esiste un canale SEPARATO diretto Samsung
Health SDK (`SamsungHealthChannel.kt`, `samsung_health_source.dart`),
agganciato all'app/SDK Samsung Health, non specificamente al Watch.

## CORREZIONE ARCHITETTURALE 2026-07-21 (audit completo Samsung Health Data SDK)

L'affermazione precedente di questo ledger ("percorso alternativo, non
quello ordinario") **sottostimava** il canale diretto. Audit completo
via agente Explore dedicato, read-only, nessuna modifica ad AppFitmesh.
FitMesh ha DUE percorsi paralleli e strutturalmente distinti, non uno
"ordinario" e un'eccezione minore:

```
Galaxy Watch
    ↓
Samsung Health (app)
    ├── Samsung Health Data SDK → FitMesh (canale diretto, MethodChannel)
    └── Health Connect → FitMesh (percorso generico, qualunque sorgente)
```

**1. Inizializzazione (SDK ufficiale, non un hack)**: è il vero Samsung
Health Data SDK v1.1.0 (`.aar` reale in `libs/samsung-health-data-api-1.1.0.aar`,
import `com.samsung.android.sdk.health.data.*`), accesso via
`HealthDataService.getStore(context)` — `SamsungHealthChannel.kt:8-21,107,121,129,150`.
Dart parla con Kotlin via `MethodChannel` `com.fitmeshsync.app/samsung_health`
(`samsung_health_source.dart:14-16`), registrato in
`MainActivity.configureFlutterEngine` (`MainActivity.kt:18-25`).

**2. Raggiungibilità reale nell'app pubblica**: NON dietro un feature
flag (`feature_flags.dart` non ha nessuna entry Samsung). Il merge
(`_mergeSamsung`) gira senza condizioni su OGNI sync per ogni utente
Android (`health_repository.dart:596,812,730-775`). C'è un entry-point
utente non-admin dedicato in Settings, `_SamsungHealthTile`, visibile a
TUTTI: "Entry-point utente per l'integrazione diretta Samsung
Health... Visibile a TUTTI (non solo admin)" (`settings_screen.dart:1118,1928-1930`),
con stringhe pubbliche EN "Connect Samsung Health" /
"Samsung Health connected — direct read active"
(`app_localizations_en.dart:1669-1680`). Shippato in produzione dalla
build `v3.3.0+114` (2026-05-27, `CHANGELOG.md:369-371`), verificato su
device reale più volte inclusa la build `v174` (2026-06-29). Esiste
SEPARATAMENTE un bottone diagnostico admin-only ("Test Samsung Health
(de-risk)", `settings_screen.dart:1781,1842-1858`) ma è solo un test di
lettura isolato, non la pipeline di merge reale.

**3. Piattaforma**: solo Android (`Platform.isAndroid` check,
`health_repository.dart:735`). Richiede API ≥29 (Android 10):
`SamsungHealthChannel.kt:96-97` verifica `Build.VERSION.SDK_INT`,
confermato anche dalla documentazione ufficiale Samsung sopra. Gate per
presenza pacchetto (`com.sec.android.app.shealth` installato,
`SamsungHealthChannel.kt:98-103,498`), NON per produttore hardware: il
codice non controlla `Build.MANUFACTURER`.

**4. Permessi**: manifest `com.samsung.android.health.permission.read`
(solo lettura, `AndroidManifest.xml:8-9`). Due set Kotlin: essenziali
(STEPS, HEART_RATE, SLEEP, ACTIVITY_SUMMARY, `SamsungHealthChannel.kt:474-479`,
usati per determinare "usabilità") ed estesi (+ BLOOD_OXYGEN,
FLOORS_CLIMBED, SKIN_TEMPERATURE, EXERCISE, BODY_COMPOSITION,
BLOOD_PRESSURE, BLOOD_GLUCOSE, WATER_INTAKE, NUTRITION, SLEEP_APNEA,
`:481-493`) richiesti insieme al dialog nativo (`:123`).

**5-6. Data type richiesti vs. realmente letti**: TUTTI i 24 campi
`samsung*` dichiarati sono sia richiesti (permesso presente) sia
effettivamente letti/popolati nel codice Kotlin — nessun campo morto.
Matrice completa sotto. HRV, VO2max e frequenza respiratoria generica
NON sono esposti dall'SDK Samsung (nessun campo `samsung*`
corrispondente): restano esclusivamente dati Health Connect.

**7. Comportamento senza Samsung Health**: `_samsungUsable` cache
tri-state; se l'app Samsung Health non è installata o l'SDK non è
disponibile, `isAvailable()` è `false`, il merge è un no-op permanente
per quell'installazione (`health_repository.dart:735-744`), nessun
errore mostrato all'utente.

**8. Fallback/layering su Health Connect**: il merge Samsung gira
SEMPRE dopo e SOPRA uno snapshot Health Connect già completo
(`readDayWindow`/`readPastDay`, `health_repository.dart:589-596,806-812`),
mai in sostituzione. Se Samsung fallisce o è assente, si ritorna lo
snapshot HC intatto (`:736,741,744,773`).

**9. Priorità/deduplicazione tra i due percorsi**: NON è un semplice
gap-fill uniforme. Frequenza cardiaca, FC a riposo, e l'intero blocco
sonno hanno **priorità Samsung** (Samsung vince se presente,
`health_snapshot.dart:239-252`); la maggior parte degli altri campi ha
**gap-fill** (HC vince se presente, Samsung riempie solo i buchi,
`:231-279`); la serie intraday del battito ha un terzo comportamento,
**gap-fill per-bucket da 5 minuti** (`mergeIntradayHeartRateJson`,
`:378-409`). Non esiste un livello di deduplicazione aggiuntivo oltre a
queste regole di merge per-campo (confermato controllando anche i
moduli di fusione dashboard-side, che operano dopo, su righe già
fuse). Regola esplicita nel codice: "mai somma tra le due sorgenti, mai
doppi conteggi" (`health_snapshot.dart:192-193`).

**10. Partnership/package/firma**: CONFERMATO dalla documentazione
ufficiale Samsung (vedi sezione sopra) che serve approvazione partner +
registrazione di package name e firma SHA-256 presso Samsung prima
della produzione; senza approvazione l'SDK funziona solo in developer
mode. FitMesh risulta approvato: `FLUTTER_MIGRATION_ROADMAP.md:434-441`,
"Samsung ha approvato la nostra app `com.fitmeshsync.app`... Ora siamo
autorizzati a usare il SDK in produzione" (2026-05-13). Nessun controllo
di firma lato codice Flutter (la verifica è lato server Samsung, non
verificabile da questo repository).

### Matrice completa: 24 campi Samsung SDK

| Campo | Disponibile nel Samsung SDK | Richiesto da FitMesh | Letto/popolato nel codice | Merge in HealthSnapshot | Alternativa Health Connect |
|---|---|---|---|---|---|
| Steps | Sì (essenziale) | Sì, `:475` | Sì, `SamsungHealthChannel.kt:160-164` | Gap-fill, HC vince se `>0` | Sì, `StepsRecord` |
| Heart rate (scalare giorno) | Sì (essenziale) | Sì, `:476` | Sì, `:209-215` | **Priorità Samsung** | Sì, `HeartRateRecord` |
| Heart rate (intraday, 5min) | Sì | Sì, `:476` | Sì, `:217-245` | **Gap-fill per-bucket** (diverso dallo scalare) | Sì, ricostruito dagli stessi campioni |
| Resting heart rate | Sì (essenziale) | Sì, `:476` | Sì, `:247-254` | **Priorità Samsung** | Sì, `RestingHeartRateRecord` |
| Distanza | Sì | Sì, `:478` | Sì, `:173-178` | Gap-fill | Sì, `DISTANCE_DELTA` |
| Calorie totali | Sì | Sì, `:478` | Sì, `:166-171` | Gap-fill | Sì, `TotalCaloriesBurnedRecord` |
| Calorie attive | Sì | Sì, `:478` | Sì, `:180-186` | Gap-fill | Sì, `ActiveCaloriesBurnedRecord` |
| Sonno (blocco intero + fasi) | Sì (essenziale) | Sì, `:477` | Sì, `:261-300` | **Priorità Samsung** (blocco atomico) | Sì, `SleepSessionRecord` |
| SpO2 | Sì (esteso) | Sì, `:483` | Sì, `:303-310` | Gap-fill | Sì, `OxygenSaturationRecord` |
| Piani saliti | Sì (esteso) | Sì, `:484` | Sì, `:312-318` | Gap-fill | Sì, `FLIGHTS_CLIMBED` |
| Temperatura cutanea | Sì (esteso) | Sì, `:485` | Sì, `:320-327` | Gap-fill | **Parziale/impreciso**: HC scrive `BODY_TEMPERATURE`, un tipo diverso da `SkinTemperatureRecord`, mappato sullo stesso campo client-side |
| Sessioni allenamento | Sì (esteso) | Sì, `:486` | Sì, `:362-389` | Gap-fill | Sì, `ExerciseSessionRecord` |
| Peso/altezza/BMI | Sì (esteso) | Sì, `:487` | Sì, `:395-403` | Gap-fill | Sì (BMI calcolato client-side, non un tipo HC nativo) |
| Pressione arteriosa | Sì (esteso) | Sì, `:488` | Sì, `:409-416` | Gap-fill | Sì, `BLOOD_PRESSURE_SYSTOLIC/DIASTOLIC` |
| Glucosio | Sì (esteso) | Sì, `:489` | Sì, `:420-426` | Gap-fill | Sì, `BLOOD_GLUCOSE` |
| Acqua | Sì (esteso) | Sì, `:490` | Sì, `:429-434` | Gap-fill | Sì, `WATER` |
| Nutrizione (kcal in) | Sì (esteso) | Sì, `:491` | Sì, `:437-442` | Gap-fill | Sì, `NUTRITION` |
| Apnea notturna | Sì (esteso) | Sì, `:492` | Sì, `:329-345` | **Priorità Samsung** | **No, esclusivo Samsung SDK** |
| HRV | **No, non esposto dall'SDK Samsung** | n/d | n/d | n/d | Sì, unica fonte |
| VO2 max | **No, non esposto dall'SDK Samsung** | n/d | n/d | n/d | Sì (ma esplicitamente escluso lato FitMesh, vedi sopra) |
| Frequenza respiratoria generica | **No, non esposto dall'SDK Samsung** | n/d | n/d | n/d | Sì, unica fonte |
| ECG | **No** | n/d | n/d | n/d | No |
| Zone frequenza cardiaca dedicate | **No** | n/d | n/d | n/d | No |
| Coaching/punteggi AI Samsung (Energy Score, ecc.) | Solo dentro l'app Samsung Health, non nell'SDK dati | n/d | n/d | n/d | No |

**Aggiornamento 2026-07-21 (preflight P1.3N-B, Fase 4)** — verificato lo
stesso canale diretto Samsung Health SDK per pressione arteriosa, in
preparazione della riga matrice "pressione arteriosa":

| Metrica | Stato codice | Citazione |
|---|---|---|
| Pressione arteriosa (systolic/diastolic) | **Letta SOLO via il canale diretto Samsung Health SDK**, non Health Connect (nessun `BloodPressureRecord` nella lista letta sopra); gap-fill (usata solo se il valore HC primario è assente), non priorità come FC/sonno | `health_repository.dart:764-765` (`samsungBloodPressureSystolic`/`samsungBloodPressureDiastolic`, passati da `_samsung.readDay`); `health_snapshot.dart:218-219,274-276` (merge gap-fill: `bloodPressureSystolic ?? samsungBloodPressureSystolic`) |

Stesso canale, stesso pattern già noto per `samsungSleepApneaDetected`
(riga sopra) — **non un dato nuovo del percorso Health Connect**, quindi
la stessa cautela editoriale si applica: se citata nell'articolo, va
descritta come "solo via canale diretto Samsung Health, non Health
Connect", mai come dato Health Connect standard.

Verificato inoltre, per completezza della matrice Fase 4 (ricerca mirata
`ECG`/`Electrocardiogram`, `HeartRateZone`, `coaching`/`AiCoach` nel
codice Flutter, 2026-07-21): **nessun ECG, nessuna zona di frequenza
cardiaca dedicata, nessun punteggio di coaching AI Samsung** risultano
letti da FitMesh in alcun percorso (né Health Connect né canale diretto
Samsung). L'unico "recovery index" presente nel codice
(`lib/features/dashboard/utils/recovery_index.dart`) è una feature
FitMesh propria, deterministica, non basata su AI né collegata a un
punteggio Samsung — da non confondere con Fitness Index/Heart Health
Score se mai citata in questo articolo.

**Conclusioni per l'articolo (Fase 8), da usare come stato per metrica**:
- HeartRateRecord, HeartRateVariabilityRmssdRecord, RestingHeartRateRecord,
  OxygenSaturationRecord, RespiratoryRateRecord, SleepSessionRecord,
  ExerciseSessionRecord, StepsRecord, calorie: **implemented_not_store_verified**
  (nel codice, percorso HC generico; nessuna prova indipendente di cosa sia
  live nella build attualmente in store senza test su hardware reale).
- SkinTemperatureRecord (il vero tipo HC dedicato): **not_supported** —
  FitMesh legge `BodyTemperatureRecord` invece, un tipo diverso.
- Vo2MaxRecord: **not_supported** via Health Connect (percorso Galaxy
  Watch) — disponibile SOLO da provider cloud OAuth diversi (Oura/Polar/
  Fitbit/Suunto, "da verificare" nel commento sorgente), mai da un watch
  via HC. **L'articolo non deve mai dire che FitMesh importa VO2 max/
  Fitness Index dal Galaxy Watch.**
- Energy Score, Daily Cardio Load, Fitness Index, AGEs Index (punteggi
  proprietari Samsung): **not_supported** — nessun equivalente diretto in
  Health Connect, FitMesh non li legge né li replica.
- Pressione arteriosa: **implemented_samsung_direct_channel_only** — mai
  via Health Connect, solo gap-fill dal canale diretto Samsung Health SDK
  (stesso pattern dell'apnea notturna).
- ECG, zone di frequenza cardiaca dedicate, coaching/punteggi AI Samsung:
  **not_supported** — nessuna lettura in nessun percorso, verificato.

## Registro verifiche

| Chi/cosa | Metodo | Esito |
|---|---|---|
| Codice Flutter reale (11 record type + gate + Galaxy-specific logic) | Agente Explore dedicato, file:line citati | Completato 2026-07-21 |
| Android Developers Health Connect data types | WebFetch diretto | Completato 2026-07-21 |
| Samsung Newsroom (Vitals/Heart Health Score/Cardio Load/Fitness Index/AGEs) | WebSearch + 2 fonti secondarie che citano la stessa URL Newsroom (fetch diretto: 4 timeout consecutivi) | Triangolato, **da riprovare fetch diretto prima della pubblicazione** |
| Data/ora evento, nome prodotto atteso, specifiche rumor | WebSearch | Completato 2026-07-21, tutto quanto non confermato resta `reported_not_confirmed` |
