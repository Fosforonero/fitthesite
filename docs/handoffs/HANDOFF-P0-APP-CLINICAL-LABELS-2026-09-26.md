# HANDOFF P0 — Segnalazione Criticità Cliniche e Metodologiche (App Mobile)

**Data**: 2026-09-26  
**Mittente**: Agente Sito / SEO Fact-Locking (Sprint PM P1.28)  
**Destinatario**: Agente Sviluppo App Mobile (`AppFitmesh`) / Matteo  
**Priorità**: P0 — Rischio Metodologico, Clinico e di Conformità Regolatoria  
**Stato**: NOTIFICATO / APERTO (In attesa di presa in carico da parte dell'agente app)  

---

## 1. Oggetto e Confini del Mandato

Durante l'audit forense del codice per il fact-locking editoriale della release pubblica (v3.10.0), sono state rilevate due criticità bloccanti nella logica di elaborazione, categorizzazione e presentazione dei dati sanitari all'interno dell'app mobile ([`lib/features/dashboard/presentation/screens/dashboard_screen.dart`](file:///Volumes/LOS%20ANGELES/Matteo/Dev%20Roba%20Mia/App%20Orologio/AppFitmesh/flutter_app/lib/features/dashboard/presentation/screens/dashboard_screen.dart)).

In base alle direttive di governance stabilite:
- **Nessuna modifica al codice dell'applicazione viene apportata dal repository del sito (`fitthesite`)**.
- **I disclaimer editoriali nel marketing o nel blog NON costituiscono una risoluzione del finding**: la correzione deve avvenire all'interno dell'applicazione mobile attraverso una revisione clinica, metodologica e UX dedicata.
- **La qualificazione regolatoria (es. potenziale inquadramento come Software as a Medical Device - SaMD sotto MDR UE 2017/745 o FDA) è un rischio di conformità da valutare formalmente con consulenti legali/regolatori**, non un verdetto giurisdizionale definitivo già emesso.

---

## 2. Dettaglio dei Finding Metodologici e Clinici

### Finding 1: Vizio Metodologico nell'Attribuzione del Badge "Prediabete" da Medie Aritmetiche Giornaliere

- **File / Righe**: `AppFitmesh/flutter_app/lib/features/dashboard/presentation/screens/dashboard_screen.dart`, righe 11200–11209 e 11244.
- **Logica attuale nel codice**:
  ```dart
  /// Range glicemico a digiuno (ADA): <100 normale, 100-125 prediabete,
  /// ≥126 diabete. Per misure random/post-prandial cambia, ma usiamo come
  /// indicazione qualitativa.
  (String, Color) _category(AppL10n l10n) {
    if (mgdl < 70) return (l10n.glucoseHypo, const Color(0xFFFF5C7A));
    if (mgdl < 100) return (l10n.glucoseNormal, const Color(0xFF31E981));
    if (mgdl < 126) return (l10n.glucosePrediabetes, const Color(0xFFFFB547));
    if (mgdl < 180) return (l10n.glucoseHyper, const Color(0xFFFF7A1A));
    return (l10n.glucoseHyperSevere, const Color(0xFFEF4444));
  }
  ```
  La card richiama `l10n.glucoseAvgDate(label, dateLabel)` esponendo all'utente l'etichetta localizzata `Prediabetes` (`l10n.glucosePrediabetes`).

- **Vizio Metodologico e Clinico**:
  1. **Disallineamento dei criteri diagnostici ADA**: I criteri dell'American Diabetes Association (ADA) per il prediabete (100–125 mg/dL) sono strettamente definiti per la **glicemia plasmatica a digiuno** (Fasting Plasma Glucose, FPG, dopo almeno 8 ore di digiuno) o tramite test orali di tolleranza al glucosio (OGTT a 2 ore, 140–199 mg/dL) o emoglobina glicata (HbA1c 5,7–6,4%).
  2. **Distorsione statistica da media aritmetica non ponderata**: Il valore passato alla card (`today.glucoseMgDl` in `health_repository.dart`) è una semplice media matematica di tutti i campioni registrati nella giornata (`_avg(glucoseVals)`). In soggetti sani o monitorati con CGM, i picchi glicemici post-prandiali raggiungono normalmente 120–140 mg/dL (o superiori). Aggregare misurazioni post-prandiali, valori a digiuno e letture estemporanee in una media aritmetica produce un valore spurio che frequentemente cade nell'intervallo 100–125 mg/dL.
  3. **Rischio per l'utente e conformità**: Attribuire a un utente sano l'etichetta clinica "Prediabete" a causa di una media matematica genera falsi positivi, ingiustificato allarme sanitario e comporta un elevato rischio di contestazione regolatoria per qualificazione implicita come dispositivo di screening/diagnosi clinica senza validazione.

- **Azione richiesta all'agente app**:
  - Rimuovere immediatamente l'assegnazione di etichette diagnostiche ("Prediabete", "Diabete") basate su medie giornaliere.
  - Limitare la visualizzazione alla misura quantitativa pura (`mg/dL` o `mmol/L`) indicando "Media giornaliera" o "Ultima lettura", senza giudizio diagnostico o con soli riferimenti neutrali a range target definiti dall'utente o dal medico.
  - Sottoporre qualsiasi categorizzazione a revisione medica e a protocolli di marcatura contestuale (es. digiuno vs post-prandiale).

---

### Finding 2: Classificazione Ipertensiva AHA 2017 Applicata a Medie Giornaliere Indistinte

- **File / Righe**: `AppFitmesh/flutter_app/lib/features/dashboard/presentation/screens/dashboard_screen.dart`, righe 11119–11133.
- **Logica attuale nel codice**:
  ```dart
  /// Classificazione AHA 2017 (sistolica/diastolica). Color coding:
  /// normale=verde, elevata=ambra, alta=rosso, ipotensione=blu.
  (String, Color) _category(AppL10n l10n) {
    if (systolic < 90 || diastolic < 60) {
      return (l10n.bpHypotension, const Color(0xFF60A5FA));
    }
    if (systolic < 120 && diastolic < 80) {
      return (l10n.bpNormal, const Color(0xFF31E981));
    }
    if (systolic < 130 && diastolic < 80) {
      return (l10n.bpElevated, const Color(0xFFFFB547));
    }
    if (systolic < 140 || diastolic < 90) {
      return (l10n.bpHypertension1, const Color(0xFFFF7A1A));
    }
    return (l10n.bpHypertension2, const Color(0xFFFF5C7A));
  }
  ```

- **Vizio Metodologico e Clinico**:
  1. **Disallineamento dalle linee guida AHA/ACC 2017**: Le categorie AHA/ACC (Normale <120/<80, Elevata 120-129/<80, Ipertensione Stadio 1 130-139/80-89, Stadio 2 ≥140/≥90) sono standardizzate per **misurazioni cliniche o domiciliari a riposo** (seduti da 5 minuti, braccio supportato, niente caffeina/esercizio recente). Per il monitoraggio pressorio ambulatoriale delle 24 ore (ABPM), le soglie diagnostiche sono del tutto diverse (media 24h < 125/75, media diurna < 130/80, media notturna < 110/65).
  2. **Mediazione aritmetica separata di sistolica e diastolica**: In `health_repository.dart`, sistolica e diastolica vengono mediate separatamente (`_avg(bpSystolicVals)`, `_avg(bpDiastolicVals)`). Una singola rilevazione post-esercizio fisico o sotto stress altera la media complessiva, attribuendo un'etichetta di "Ipertensione Stadio 1" o "Ipertensione Stadio 2" che non riflette lo stato pressorio basale dell'utente.
  3. **Anomalia logica del disgiunto `||`**: La condizione `if (systolic < 140 || diastolic < 90)` classifica come Stadio 1 una pressione con sistolica a 160 (Stadio 2) se la diastolica è 85, poiché la diastolica soddisfa la condizione `< 90`.

- **Azione richiesta all'agente app**:
  - Allineare la visualizzazione alle specifiche definite per lo sprint 192-3: conservazione della coppia indivisibile (sistolica/diastolica con orario di rilevazione), visualizzazione dell'ultima misurazione valida a riposo anziché della media matematica oraria/giornaliera, ed eliminazione delle etichette cliniche di stadio ipertensivo se non basate su protocolli approvati.

---

## 3. Vincoli e Impatto Editoriale (Repository `fitthesite`)

Fino alla completa risoluzione dei finding sopra descritti e alla verifica con test sintetici su build pubblica:
- **Tassativo HOLD (Bozze non pubblicabili)** per le guide metriche C (Pressione Arteriosa) e D (Glicemia).
- **Divieto di utilizzo** di termini diagnostici ("Prediabete", "Ipertensione", "Screening") nella comunicazione di prodotto e nella documentazione del sito.
- **Divieto di creare slug o URL indicizzabili** per tali metriche fino a nuova autorizzazione formale.

---

## 4. Registro di Trasmissione Formale

- **Canale**: File di sincronizzazione inter-agente depositato in:
  - `fitthesite/docs/handoffs/HANDOFF-P0-APP-CLINICAL-LABELS-2026-09-26.md`
  - `AppFitmesh/docs/HANDOFF-P0-APP-CLINICAL-LABELS-2026-09-26.md`
- **Data Notifica**: 2026-09-26T12:15:00+02:00
- **Mittente**: Agente P1.28 Site Fact-Locking
- **Ricevente designato**: App Mobile Agent / Matteo
