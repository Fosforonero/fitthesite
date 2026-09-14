# Report di Handover P0 — Ottimizzazione CTR (5 URL Canoniche) e Revisione Finale

> **Destinatario**: Agente del sito / Maintainer `fitthesite`  
> **Data**: 2026-09-14  
> **Branch**: `seo/p0-ctr-optimization-5urls` (basato direttamente su `origin/main` @ `dc4aca4`)  
> **Stato**: `PREPARATO` (corretto localmente, non pubblicato) · Test verdi · **STOP PRIMA DEL MERGE**

---

## 1. Riconciliazione con `origin/main` e PR Pubblicate

Il branch è allineato all'HEAD di `origin/main` (`dc4aca4` / PR #70):

* **Moduli Funnel P1.9 (`#62`, `#63`)**: Il blocco `in-article-cta` in `BlogRenderer.tsx` e `StoreButtonsRow.tsx` sono operativi nel flusso editoriale.
* **Tracking CTA (`OutboundTracker.tsx`, `lib/analytics/cta.ts`)**: Emessi eventi `cta_view`, `cta_click` e `store_click`. **Dichiarazione di perimetro**: il click allo store misura solo l'uscita; nessuna attribuzione tecnica post-click su installazioni o acquisti.
* **Infrastruttura & Vercel**: Nessun cron orario; `vercel.json` mantiene solo `beta-welcome-emails`.
* **Cron IndexNow**: Coerente con la baseline del 2026-09-03, il cron ricorrente Vercel è disattivato; le sottomissioni avvengono tramite script in `tools/`.
* **Privacy Containment (`#67` / P0.18A)**: Rispettato il divieto di claim non comprovati.
* **Traduzioni Europee PR `#70` (P1.21-C)**: Compatibilità verificata con l'estensione ES/PT/PL/NL/SV/DA.

---

## 2. Baseline Ricostruita dall'Export Ufficiale GSC (09/09/2026)

* **Fonte dati**: Archivio originale `fitmesh.fit-Performance-on-Search-2026-09-09.zip`.
* **Filtri applicati**: `Filters.csv` -> Search type: `Web`, Periodo: `Last 3 months` (intervallo esatto estratto da `Chart.csv`: **2026-06-07** - **2026-09-06**).
* **Nessun dato stimato**: I valori di Clic, Impression, CTR e Posizione provengono esattamente da `Pages.csv`.
* **Assenza di segmentazione pagina-query nell'export**: L'export GSC ufficiale fornisce separatamente `Pages.csv` (metriche aggregate per URL) e `Queries.csv` (metriche aggregate sitewide). Non contiene una matrice bidimensionale URL ✕ Query. Pertanto, l'associazione di specifiche query o intenti di ricerca a ciascuna pagina è **dichiarata formalmente come ipotesi qualitativa editoriale**, non come attribuzione misurata.
* **Segmentazione del test**:
  * **3 Target EN Primari**: Volumi elevati di impressioni con CTR debole o margini di ottimizzazione snippet.
  * **1 Target IT Secondario**: Volume moderato con spazio di miglioramento CTR rispetto ad altre varianti europee.
  * **1 Miglioramento Editoriale Qualitativo (Fuori KPI CTR)**: Galaxy Ring IT presenta solo 75 impressioni in 3 mesi (campione insufficiente per significatività statistica CTR); la modifica risolve un'eccessiva estensione editoriale del titolo (96c) ed è esclusa dal monitoraggio KPI CTR.

### Tabella Metriche di Baseline (GSC 2026-06-07 / 2026-09-06)

| Ruolo Test | URL Canonica Effettiva | Locale | File TS | Impression | Clic | CTR | Posizione | Ipotesi di Intento di Ricerca (Qualitativa) |
|---|---|---|---|---:|---:|---:|---:|---|
| **Target Primario EN** | `https://www.fitmesh.fit/en/blog/google-health-replaces-google-fit` | EN | `google-health-google-fit.ts` | 7.457 | 40 | 0,54% | 7,20 | Differenze concettuali Google Health vs Google Fit e transizione futura annunciata |
| **Target Primario EN** | `https://www.fitmesh.fit/en/blog/galaxy-ring-android-health-connect` | EN | `galaxy-ring-android-health-connect.ts` | 2.929 | 9 | 0,31% | 8,09 | Setup Galaxy Ring su Android e canali di sincronizzazione con Health Connect |
| **Target Primario EN** | `https://www.fitmesh.fit/en/blog/oura-ring-health-connect-android` | EN | `oura-ring-health-connect-android.ts` | 1.049 | 2 | 0,19% | 10,21 | Guida all'integrazione Oura Ring con Health Connect su sistema Android |
| **Target Secondario IT** | `https://www.fitmesh.fit/it/blog/garmin-samsung-health-sync-guide` | IT | `garmin-samsung-health-sync-guide.ts` | 894 | 17 | 1,90% | 6.61 | Guida operativa alla sincronizzazione tra Garmin Connect e Samsung Health |
| **Miglioramento Editoriale** *(Escluso KPI CTR)* | `https://www.fitmesh.fit/it/blog/galaxy-ring-android-health-connect` | IT | `galaxy-ring-android-health-connect.ts` | 75 | 1 | 1,33% | 6,89 | Setup Galaxy Ring su Android (modifica qualitativa: risoluzione lunghezza titolo 96c) |

*Nota Dispositivo*: Il dato per singola URL non è segmentato nei report GSC base (aggregato sitewide da `Devices.csv`: mobile 66,7%, desktop 33,3%).

---

## 3. Schede Prima / Dopo dei Metadati Renderizzati

> **Regola di Rendering**: `blog/[slug]/page.tsx` appende automaticamente il brand suffix ` · FitMesh` (10 caratteri) al tag `<title>`, a `og:title` e `twitter:title`. L'H1 visibile in pagina (`post.hero.title`) e il corpo dell'articolo **restano rigorosamente invariati**. I conteggi di seguito sono verificati programmaticamente.

### Target Primario 1 (EN): `/en/blog/google-health-replaces-google-fit`
* **Data Ultima Modifica nel Codice**: 2026-08-25 (PR #61)
* **Title Prima**:
  * Base (`origin/main` `seoTitle.en`): `"Google Health vs Google Fit: What Changed?"` (42c)
  * Renderizzato: `Google Health vs Google Fit: What Changed? · FitMesh` (**52c**)
* **Title Dopo**:
  * Base (`seoTitle.en`): `"Google Health vs Google Fit: What Changes in 2026"` (49c)
  * Renderizzato: `Google Health vs Google Fit: What Changes in 2026 · FitMesh` (**59c**)
* **Verifica Contenuto & Motivazione**: L'articolo analizza le differenze tra le piattaforme e la transizione futura annunciata per fine 2026, precisando che la migrazione dei dati consumer non è ancora attiva né completata da Google. La formulazione "What Changes in 2026" sostituisce la formulazione passiva "What Changed?" rispecchiando esattamente lo stato di transizione senza fare promesse ingannevoli (es. "Migration Guide" scartata perché non vi è migrazione eseguibile).
* **Meta Description**: Invariata (148c).

### Target Primario 2 (EN): `/en/blog/galaxy-ring-android-health-connect`
* **Data Ultima Modifica nel Codice**: 2026-09-01 (PR #63)
* **Title Prima**:
  * Base (fallback su `hero.title.en`): `"Galaxy Ring on Android: setup, health data, and Health Connect sync"` (67c)
  * Renderizzato: `Galaxy Ring on Android: setup, health data, and Health Connect sync · FitMesh` (**77c**)
* **Title Dopo**:
  * Base (`seoTitle.en`): `"Galaxy Ring on Android: Setup & Health Connect Sync"` (51c)
  * Renderizzato: `Galaxy Ring on Android: Setup & Health Connect Sync · FitMesh` (**61c**)
* **Motivazione**: Compattazione del titolo da 77c a 61c renderizzati per rendere visibile l'intento principale entro le soglie tipiche di troncamento visivo delle SERP desktop e mobile.
* **Meta Description**: Invariata (152c).

### Target Primario 3 (EN): `/en/blog/oura-ring-health-connect-android`
* **Data Ultima Modifica nel Codice**: 2026-09-01 (PR #63)
* **Title Prima**:
  * Base (fallback su `hero.title.en`): `"Oura Ring on Android: Health Connect sync and what data you can access"` (70c)
  * Renderizzato: `Oura Ring on Android: Health Connect sync and what data you can access · FitMesh` (**80c**)
* **Title Dopo**:
  * Base (`seoTitle.en`): `"Oura Ring on Android: Health Connect Sync Guide"` (47c)
  * Renderizzato: `Oura Ring on Android: Health Connect Sync Guide · FitMesh` (**57c**)
* **Motivazione**: Compattazione del titolo da 80c a 57c renderizzati, introducendo la dicitura guida/sync per intercettare l'intento di configurazione.
* **Meta Description**: Invariata (154c).

### Target Secondario 4 (IT): `/it/blog/garmin-samsung-health-sync-guide`
* **Data Ultima Modifica nel Codice**: 2026-08-25 (PR #62)
* **Title Prima**:
  * Base (fallback su `hero.title.it`): `"Come sincronizzare Garmin con Samsung Health e Health Connect nel 2026"` (70c)
  * Renderizzato: `Come sincronizzare Garmin con Samsung Health e Health Connect nel 2026 · FitMesh` (**80c**)
* **Title Dopo**:
  * Base (`seoTitle.it`): `"Sincronizzare Garmin con Samsung Health (2026)"` (46c)
  * Renderizzato: `Sincronizzare Garmin con Samsung Health (2026) · FitMesh` (**56c**)
* **Motivazione**: Allineamento alla formula sintetica già adottata con successo nella variante tedesca (`Garmin mit Samsung Health synchronisieren`), passando da 80c a 56c renderizzati.
* **Meta Description**: Invariata (156c).

### Miglioramento Editoriale 5 (IT, Fuori KPI CTR): `/it/blog/galaxy-ring-android-health-connect`
* **Data Ultima Modifica nel Codice**: 2026-09-01 (PR #63)
* **Title Prima**:
  * Base (fallback su `hero.title.it`): `"Galaxy Ring su Android: impostazione, dati di salute e sincronizzazione Health Connect"` (86c)
  * Renderizzato: `Galaxy Ring su Android: impostazione, dati di salute e sincronizzazione Health Connect · FitMesh` (**96c**)
* **Title Dopo**:
  * Base (`seoTitle.it`): `"Galaxy Ring su Android: Setup e Health Connect"` (46c)
  * Renderizzato: `Galaxy Ring su Android: Setup e Health Connect · FitMesh` (**56c**)
* **Motivazione**: Intervento puramente qualitativo ed editoriale. Con 75 impressioni in 3 mesi non vi è volume sufficiente per testare il CTR; il titolo base a 86c (96c renderizzato) risultava tuttavia macroscopicamente sproporzionato rispetto agli standard del sito e viene compattato a 56c.
* **Meta Description**: Invariata (160c).

---

## 4. Controlli di Non-Regressione e Suite di Test

* **TypeScript**: `npx tsc --noEmit` ➔ 0 errori.
* **Guardrail Bing**: `tools/check-bing-seo-recommendations.ts` ➔ VERDE (tutti i title ≤ 70c, meta 150-160c).
* **Guardrail Dati Strutturati**: `tools/check-p016-structured-data.ts` ➔ VERDE.
* **Guardrail Privacy Containment**: `tools/check-p018a-privacy-containment.ts` ➔ VERDE (0 regressioni).
* **Pre-commit hook mobile**: `check-mobile-routes` ➔ 45 route verificate con successo.
* **Suite Vitest**: `pnpm test` ➔ 48 file passati, 897 test eseguiti con successo, 0 falliti.
* **Riconciliazione Perimetro Suite**:
  * `perimetro-suite.conf` riporta `file=50, test=919, saltati=21`.
  * La suite raccoglie `50 file, 920 test, 23 saltati`.
  * **Spiegazione della differenza (non causata da questo branch)**:
    1. Il `+1 test` deriva dallo scaling automatico parametrizzato di `lib/blog/language-switcher-ssot.test.ts` introdotto dall'aggiunta del post `nuova-apple-health.ts` in PR #69 (`17d9ef0`), che non aveva aggiornato il perimetro.
    2. I `+2 saltati` (da 21 a 23) corrispondono ai 2 test in `app/api/v1/billing/validate-purchase/route.db.test.ts` che vengono marcati saltati quando eseguiti in assenza del container isolato PostgreSQL PG17.
    3. Il presente branch ha toccato 0 file di test (`git diff origin/main..HEAD -- '*.test.*'` è vuoto). Nessuna soglia è stata aggiornata automaticamente, in conformità con la policy.

---

## 5. Protocollo di Misurazione Sperimentale

1. **Inizio Esperimento**: Coincide con la data del **deployment effettivo in produzione** (non con la data di stesura del codice).
2. **Tracciamento SERP**: Registrazione separata della prima data utile in cui gli snippet aggiornati vengono effettivamente osservati nelle SERP di Google e Bing tramite ispezione URL o cache.
3. **Punti di Controllo**:
   * **+14 giorni dal deploy**: Prima rilevazione esplorativa. Ammesso l'esito formale "dati insufficienti" qualora le impression accumulate non consentano significatività statistica.
   * **+28 giorni dal deploy**: Valutazione del periodo consolidato.
4. **Vincoli Metodologici e di Causalità**:
   * Il paniere primario di valutazione CTR è ristretto ai **3 target EN** e al **target IT secondario** (Garmin). Galaxy Ring IT è escluso dai KPI CTR.
   * Il confronto temporale prima/dopo non dimostra da solo causalità: fattori esogeni (aggiornamenti algoritmici, fluttuazioni di mercato stagionali) possono alterare le metriche.
   * L'analisi dovrà obbligatoriamente normalizzare per la **posizione media** (un peggioramento di ranking deprime il CTR indipendentemente dal titolo) e monitorare il **query mix** complessivo.

---

## 6. Stato Git del Branch

* **Branch**: `seo/p0-ctr-optimization-5urls`
* **Base**: `origin/main` (`dc4aca4`)
* **Diff**: 4 file TypeScript di post del blog + `docs/seo/seo-results-log.md` + `docs/seo/p0-ctr-optimization-report.md`.
* **STOP**: Nessun merge eseguito. Il codice è pronto per la review finale.
