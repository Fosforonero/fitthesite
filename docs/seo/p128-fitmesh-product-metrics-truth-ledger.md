# Truth Ledger Rettificato — Sprint PM P1.28: FitMesh spiegato bene (Pillar e Metriche)

**Data**: 2026-09-26  
**Repository**: `Fosforonero/fitthesite`  
**Branch**: `content/p128-fitmesh-pillar-guide-metriche`  
**Stato**: STOP prima di ogni merge, deploy e IndexNow  

---

## 1. Baseline Release per Piattaforma

La verifica tecnica diretta sui negozi applicativi e sui metadati di distribuzione stabilisce la baseline pubblica ufficiale:

- **iOS (Apple App Store — storefront IT e UE)**:
  - Versione distribuita: **3.10.0**
  - Data di rilascio versione: **10 settembre 2026** (2026-09-10T07:05:32Z)
  - Bundle ID: `com.fitmeshsync.app`
  - Nome store: *FitMesh Sync: dati salute*
- **Android (Google Play Store — IT e globale)**:
  - Versione distribuita: **3.10.0**
  - Data di rilascio versione: **9 settembre 2026** (1788966661)
  - Application ID: `com.fitmeshsync.app`
  - Note di rilascio ufficiali 3.10.0: *Giorni passati, grafico passi orari affidabile, rientro rapido post-disconnessione, errori accanto ai pulsanti, rimozione sigle tecniche, correzioni su pressione, anello e battito.*

*Rettifica*: il riferimento a `3.9.9+190` rappresentava il numero di build del candidato locale nel worktree `hotfix/3.9.9+190` / `pubspec.yaml`, non la versione commerciale visibile e distribuita all'utente finale, che è **3.10.0** su entrambi gli store.

---

## 2. Inventario, Ipotesi Editoriali e Matrice Anticannibalizzazione

> **Nota metodologica**: le query sotto elencate sono qualificate come **IPOTESI EDITORIALI**. Non derivano da un'attribuzione dimostrata riga-per-riga da export unificati di Search Console (Pages.csv e Queries.csv separati non consentono correlazioni certe); costituiscono l'intento di ricerca cercato e presidiato dal piano editoriale.

| Contenuto | Tipo / Stato | Ipotesi Editoriali di Ricerca (Non certificate da export) | Intent Utente | Confini Rigorosi (Anticannibalizzazione) |
|---|---|---|---|---|
| **`come-funziona-fitmesh`** | Pillar 1 (Esistente) | *come funziona fitmesh, cos'è fitmesh, what is fitmesh, how fitmesh works, fitmesh sync app* | Informazionale sul prodotto: architettura reale su mobile (iOS/Android), lettura locale da Health Connect / Apple Salute, Bluetooth per anello Colmi, schermate dell'app 3.10.0, permessi e limiti. | Nessun confronto diretto per riga con competitor (demandato a Pillar 2). Nessuna promessa di dashboard web personale attiva (#79). Nessun claim di deduplicazione assoluta. |
| **`fitmesh-vs-alternative-sync`** | Pillar 2 (Esistente) | *fitmesh sync vs alternative, health sync alternativa, fitnesssyncer alternative, gadgetbridge alternative* | Decisionale / Comparativo: quando conviene FitMesh e quando scegliere Health Sync (bridge puro), FitnessSyncer (cloud USA) o Gadgetbridge (100% locale, zero cloud). | Nessun tutorial passo-passo sulle schermate di FitMesh. Nessuna classifica autocelebrativa; riconoscimento esplicito dei punti di forza dei concorrenti. |
| **`alternative-app-sync-wearable-2026`** | Ecosistema (Esistente) | *alternative sync wearable 2026, come sincronizzare smartwatch diversi* | Rassegna ampia dell'ecosistema di sincronizzazione wearable (standard di mercato). | Non focalizzato su FitMesh. |
| **Pressione arteriosa** (Guida C) | Guida Metrica C (Nuova) | *pressione arteriosa app salute fitmesh, sincronizzare pressione health connect, blood pressure health connect apple health* | Informazionale: come transitano i dati di pressione dagli sfigmomanometri all'app e quali sono i limiti attuali. | **Evitare slug/titoli che associno la pressione a una misura autonoma dello smartwatch o dell'anello**. Nessun consiglio medico o diagnosi di ipertensione. |
| **Glicemia** (Guida D) | Guida Metrica D (Nuova) | *glicemia glucometri health connect, cgm sensori health connect fitmesh, blood glucose sync android iphone* | Informazionale e di cautela: transito dei dati da sensori CGM / glucometri tramite Health Connect e HealthKit; limiti della media giornaliera. | **DIVIETO ASSOLUTO di suggerire che uno smartwatch misuri la glicemia**. Divieto di replicare il badge "Prediabete" della UI. |
| **Peso e BMI** (Guida E) | Guida Metrica E (Nuova) | *bilancia smart fitmesh, peso bmi salute fitmesh, smart scale weight bmi health connect* | Trasparenza e fact-checking: chiarire cosa legge davvero FitMesh (peso, altezza, BMI calcolato e trend del peso). | **Distinguere sempre BMI da percentuale di grasso e massa magra**. Chiarire che la bioimpedenza non è estratta né mostrata. |

---

## 3. Matrice di Verità Tecnica e Stato delle Prove (`CODE_VERIFIED` vs `PUBLIC_BUILD_UNVERIFIED`)

Nessun dato personale è stato consultato. Le evidenze derivano dall'analisi statica del codice (v3.10.0), delle migrazioni Supabase e dell'APK/AAB distribuito.

| Metrica | Sorgente teorica | Framework esportatore | Permesso dichiarato | Stato Codice (`CODE_VERIFIED`) | Stato Release Pubblica (`PUBLIC_BUILD_UNVERIFIED`) | Backend Supabase (`fitness_metrics`) | Limiti Dimostrati e Criticità |
|---|---|---|---|---|---|---|---|
| **Pressione arteriosa** | Sfigmomanometri smart (Withings/Omron) o Samsung calibrato. (*Anelli: nessuna misurazione valida*). | Android: Health Connect (`BloodPressureRecord`).<br>iOS: HealthKit (`HKCorrelationTypeIdentifierBloodPressure`). | Android: `READ_BLOOD_PRESSURE`<br>iOS: Sistolica e Diastolica in HealthKit | Raccoglie i campioni del giorno e calcola la **media separata** di sistolica e diastolica (`_avg(bpSystolicVals)`, `_avg(bpDiastolicVals)`). | `_BloodPressureCard`: card singola con icona cuore, coppia media `sistolica/diastolica mmHg` e categoria qualitativa AHA a colori. **Manca prova sintetica riproducibile su build 3.10.0 distribuita**. | Colonne `blood_pressure_systolic numeric`, `blood_pressure_diastolic numeric`. | **Nessun grafico orario intraday**. I valori multipli (mattina/sera) sono fusi nella media. **Nessun inserimento manuale in FitMesh**. Nessuna pillola in Home. Rischio clinico classificazione media (Handoff P0 aperto). |
| **Glicemia** | Sensori CGM (Dexcom, Abbott Libre via app terze) o glucometri tradizionali. (*Smartwatch/anelli: nessuna misurazione diretta*). | Android: Health Connect (`BloodGlucoseRecord`).<br>iOS: HealthKit (`HKQuantityTypeIdentifierBloodGlucose`). | Android: `READ_BLOOD_GLUCOSE`<br>iOS: Glicemia in HealthKit | Converte in mg/dL se necessario e calcola la **media giornaliera** (`_avg(glucoseVals)`). | `_GlucoseCard`: card con icona goccia, data e badge qualitativo ADA basato su soglie a digiuno. **Manca prova sintetica riproducibile su build 3.10.0 distribuita**. | Colonna `blood_glucose_mgdl numeric`. | **Nessun tracciato continuo CGM** (nessun grafico a curve). Nessun allarme ipo/iperglicemia. Nessun inserimento manuale in FitMesh. **Criticità P0**: badge "Prediabete" applicato a una media giornaliera che include il post-prandiale. |
| **Peso e Altezza** | Bilance connesse o log manuali nell'hub salute. | Android: Health Connect (`WeightRecord`, `HeightRecord`).<br>iOS: HealthKit (`HKQuantityTypeIdentifierBodyMass`, `HKQuantityTypeIdentifierHeight`). | Android: `READ_WEIGHT`, `READ_HEIGHT`<br>iOS: Peso e Altezza | Prende l'ultimo peso del giorno (`weightKgLast`) e l'altezza disponibile. | `_BodyCompositionCard`: peso attuale (`kg` o `lbs`), badge altezza, grafico storico dell'andamento del peso. **Manca prova sintetica riproducibile su build 3.10.0 distribuita**. | Colonne `weight_kg`, `height_cm`. | Il peso inserito nel profilo non è un tracciamento a eventi; l'app legge l'ultimo peso registrato dal framework. |
| **BMI** | Valore matematico derivato. | Calcolato da FitMesh: `peso_kg / (altezza_m)^2`. | Deriva dai permessi peso e altezza. | Calcolato in `health_repository.dart`. | Badge `BMI` con colore di fascia. | Colonna `bmi numeric(4,2)`. | È un indice statistico generale; non misura la composizione corporea reale. |
| **Composizione Corporea (BIA)**: Grasso %, Massa Magra, Acqua, Ossa | Bilance con bioimpedenziometria (BIA). | Hub espongono i tipi, ma FitMesh **non li richiede**. | **Non richiesti** nella 3.10.0. | **ASSENTE**. Nessun campo in `HealthSnapshot` né nel repository. | **ASSENTE**. La card si intitola "Composizione corporea", ma mostra solo peso, altezza e BMI. | **ASSENTE**. Nessuna colonna nel database per massa grassa o magra. | **NON PUBBLICABILE come capacità attuale**. Fa parte dello sprint 192-2/192-3, attualmente **NO-GO release**. |

---

## 4. Handoff P0 Separato per l'Agente App

È stato redatto e registrato il file di handoff formale:
- Repository del sito: [`docs/handoffs/HANDOFF-P0-APP-CLINICAL-LABELS-2026-09-26.md`](file:///Volumes/LOS%20ANGELES/Matteo/Dev%20Roba%20Mia/App%20Orologio/fitthesite-p128-fitmesh-pillars-metrics/docs/handoffs/HANDOFF-P0-APP-CLINICAL-LABELS-2026-09-26.md)
- Cartella di coordinamento condivisa: [`docs/HANDOFF-P0-APP-CLINICAL-LABELS-2026-09-26.md`](file:///Volumes/LOS%20ANGELES/Matteo/Dev%20Roba%20Mia/App%20Orologio/docs/HANDOFF-P0-APP-CLINICAL-LABELS-2026-09-26.md)

**Sintesi dei finding P0**:
1. **`_GlucoseCard`**: attribuzione del badge clinico `Prediabetes` (`glucosePrediabetes`) a valori tra 100 e 125 mg/dL calcolati sulla media dell'intera giornata (che include fisiologicamente i pasti).
2. **`_BloodPressureCard`**: attribuzione delle categorie AHA di ipertensione su valori medi di sistolica e diastolica aggregati matematicamente, con branching `||` su categorie miste.

**Vincolo rispettato**: nessuna modifica al codice dell'applicazione è stata eseguita dal repository del sito. Il disclaimer editoriale non è presentato come risoluzione del finding dell'app.

---

## 5. Riconciliazione PR #79 e Trattamento Multi-Locale per `come-funziona-fitmesh`

### Analisi Diff PR #79 (`content/p024c-dashboard-web-truth`)
PR #79 ha bonificato `come-funziona-fitmesh.ts` rimuovendo le affermazioni che descrivevano la dashboard web come disponibile da qualsiasi browser.

### Decisione Strategica sulle 6 Varianti Indicizzabili (IT, EN, ES, DE, PT, FR)
Per evitare discrepanze fattuali o disallineamenti linguistici tra varianti con lo stesso slug/intento, la revisione del Pillar 1:
1. **Copre integralmente tutte le 6 varianti indicizzabili (IT, EN, ES, DE, PT, FR)** su tutti i punti di verità:
   - Eliminazione del claim di dashboard web disponibile (allineamento a PR #79).
   - Eliminazione della dicitura "senza doppioni" / "mai contato due volte" (sostituita da priorità di sorgente e finestre temporali).
   - Rimozione di Suunto come connettore diretto.
   - Rimozione di Oura come "in arrivo" (l'API Oura è esterna e non integrata).
   - Allineamento della nota Founder al passato storico SSOT.
2. In questo modo nessuna delle 6 lingue indicizzabili conserva promesse superate o non verificate, preservando l'integrità del perimetro e prevenendo penalizzazioni qualitative multilingue.

---

## 6. Verdetto GO / HOLD per le Cinque Pagine

| Pagina / Documento | Ruolo | Verdetto | Motivazione e Condizioni di Sblocco |
|---|---|---|---|
| **`come-funziona-fitmesh`** | Pillar 1 (Esistente) | **GO (PR 1)** | Può essere aggiornato subito. Riconciliazione completa con PR #79, bonifica su tutte le 6 lingue (IT/EN/ES/DE/PT/FR), eliminazione di dashboard web, Suunto, Oura in arrivo, deduplicazione assoluta e Founder. |
| **`fitmesh-vs-alternative-sync`** | Pillar 2 (Esistente) | **GO (PR 1 o PR distinta)** | Può essere aggiornato subito (lingue IT/EN). Riconciliazione con PR #79 (nessuna web dashboard personale attiva); confronto bilanciato e oggettivo con Health Sync, FitnessSyncer e Gadgetbridge. |
| **Guida C (Pressione arteriosa)** | Guida Metrica (Nuova) | **HOLD (Bozza non pubblicabile)** | **Bloccante**: manca la prova riproducibile su build pubblica 3.10.0 con dati sintetici. Non è verificata la compatibilità con specifici modelli Withings/Omron/Samsung nella catena app-bridge-regione. Finding P0 aperto sulla classificazione media AHA. |
| **Guida D (Glicemia)** | Guida Metrica (Nuova) | **HOLD (Bozza non pubblicabile)** | **Bloccante**: manca la prova riproducibile su build pubblica 3.10.0 con dati sintetici. Finding P0 aperto sul badge "Prediabete" applicato alla media. Rischio di disinformazione sanitaria. Nessuna compatibilità con specifici CGM Dexcom/Libre verificata. |
| **Guida E (Peso e BMI)** | Guida Metrica (Nuova) | **HOLD (Bozza non pubblicabile)** | **Bloccante**: manca la prova riproducibile su build pubblica 3.10.0 con dati sintetici. Sbloccabile solo dopo tale verifica, e pubblicabile esclusivamente come guida di verità su Peso, Altezza e BMI calcolato, dichiarando esplicitamente che massa magra e grasso % BIA **non sono supportati**. |

---

## 7. Stato di Rilascio

🛑 **STRICT STOP**:
- Nessun merge.
- Nessun deploy.
- Nessun invio IndexNow o Validate Fix GSC.
- Le guide C, D, E restano congelate in **HOLD**.
