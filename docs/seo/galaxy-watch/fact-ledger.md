# Galaxy Watch Unpacked — Fact Ledger (P1.3N)

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

Fonte primaria: [Samsung Newsroom — "Samsung Introduces Next-Gen Galaxy
Watch Features for AI-Powered Everyday Health Companion"](https://news.samsung.com/global/samsung-introduces-next-gen-galaxy-watch-features-for-ai-powered-everyday-health-companion).
**Nota metodologica**: il fetch diretto di questa URL ha dato timeout
4 volte consecutive (problema di rete/server, non di fonte) — i contenuti
sotto sono triangolati da due fonti secondarie indipendenti che citano
esplicitamente e riprendono questo stesso comunicato Samsung
([Wareable](https://www.wareable.com/samsung/samsung-galaxy-watch-health-platform-update-vitals-fitness-index-cardio-load-new-features),
[GSMArena, pubblicato 2026-06-04](https://www.gsmarena.com/samsung_health_app_update_new_galaxy_watch_features-news-73127.php),
quest'ultimo cita esplicitamente la stessa URL Newsroom come fonte).
**Prima di pubblicare, ritentare il fetch diretto della pagina Newsroom**
per una citazione verbatim primaria (Fase 15).

| Claim | Stato | Fonte | Verificato | Decisione editoriale | Nota geo |
|---|---|---|---|---|---|
| **Vitals**: analizza 5 segnali notturni (battito, HRV, frequenza respiratoria, temperatura cutanea, SpO₂) confrontati con la baseline personale a riposo, per rilevare deviazioni significative | `confirmed_by_samsung` (via triangolazione, vedi nota sopra) | Samsung Newsroom (triangolato) | 2026-07-21 | Usabile in Fase 6.4; **non dire che diagnostica infezioni o malattie** (Fase 4/6) | — |
| **Heart Health Score**: evoluzione di "Vascular Load", combina composizione corporea + sonno + stress + attività in un punteggio cardiovascolare giornaliero | `confirmed_by_samsung` (via triangolazione) | Samsung Newsroom (triangolato) | 2026-07-21 | Usabile in Fase 6.7; punteggio proprietario, non esportabile 1:1 | — |
| **Daily Cardio Load**: misura lo sforzo cardiovascolare accumulato, calcola la capacità di allenamento e suggerisce target/riposo | `confirmed_by_samsung` (via triangolazione) | Samsung Newsroom (triangolato) | 2026-07-21 | Usabile in Fase 6.5; distinguere dato grezzo (HR) da punteggio Samsung | — |
| **Fitness Index**: analizza battito, VO₂ max e passi giornalieri, confronta con i pari (peer group) | `confirmed_by_samsung` (via triangolazione) | Samsung Newsroom (triangolato) | 2026-07-21 | Usabile in Fase 6.6; **non affermare che FitMesh importi il Fitness Index** (Fase 6/8 — VO2 max non è comunque letto da FitMesh via Health Connect, vedi sezione FitMesh sotto) | — |
| **AGEs Index**: cattura automaticamente misurazioni notturne per una panoramica dell'impatto dello stile di vita nel lungo periodo | `confirmed_by_samsung` (via triangolazione) | Samsung Newsroom (triangolato) | 2026-07-21 | Usabile in Fase 6.7; **non presentare come diagnosi o previsione certa dell'invecchiamento** (Fase 6) | — |
| Le nuove funzioni (Vitals, Heart Health Score, Daily Cardio Load, Fitness Index, AGEs Index) saranno disponibili PRIMA sui Galaxy Watch di prossima generazione — i modelli esistenti (Watch 7, Watch Ultra) non le ricevono subito nonostante l'update app | `confirmed_by_samsung` (via triangolazione, GSMArena cita testualmente "will be first available on the next-gen Galaxy Watches") | Samsung Newsroom (triangolato) | 2026-07-21 | Fatto centrale per l'angolo editoriale "perché conta il nuovo Watch, non solo l'app" | — |
| App Samsung Health riorganizzata in 5 aree: Sleep, Activity, Nutrition, Mindfulness, Vitals | `confirmed_by_samsung` (via triangolazione) | Samsung Newsroom (triangolato) | 2026-07-21 | Contesto, non centrale | — |

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
agganciato all'app/SDK Samsung Health, non specificamente al Watch — da
verificare più a fondo se rilevante per la sezione Fase 8 dell'articolo
(percorso alternativo, non quello "ordinario" citato nel mandato).

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

## Registro verifiche

| Chi/cosa | Metodo | Esito |
|---|---|---|
| Codice Flutter reale (11 record type + gate + Galaxy-specific logic) | Agente Explore dedicato, file:line citati | Completato 2026-07-21 |
| Android Developers Health Connect data types | WebFetch diretto | Completato 2026-07-21 |
| Samsung Newsroom (Vitals/Heart Health Score/Cardio Load/Fitness Index/AGEs) | WebSearch + 2 fonti secondarie che citano la stessa URL Newsroom (fetch diretto: 4 timeout consecutivi) | Triangolato, **da riprovare fetch diretto prima della pubblicazione** |
| Data/ora evento, nome prodotto atteso, specifiche rumor | WebSearch | Completato 2026-07-21, tutto quanto non confermato resta `reported_not_confirmed` |
