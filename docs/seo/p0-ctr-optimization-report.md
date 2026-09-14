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

## 2. Baseline Ricostruita dai Dati Reali (5 URL Canoniche)

In conformità alle linee guida metodologiche:
- Nessun dato stimato: i valori non presenti nell'export sono dichiarati non disponibili.
- Le URL sono verificate con `lib/blog/slugs.ts` per corrispondere alle varianti canoniche effettive.
- Esclusi tutti i post Apple Health pubblicati di recente (`nuova-apple-health.ts`, PR #69-#70).

| # | URL Canonica Effettiva | Locale | File TS | Impression | Clic | CTR | Posizione | Fonte Export / Periodo | Query Disponibili / Intento |
|---|---|---|---|---:|---:|---:|---:|---|---|
| 1 | `https://www.fitmesh.fit/en/blog/google-health-replaces-google-fit` | EN | `google-health-google-fit.ts` | 1.127 | 9 | 0,80% | 8,17 | GSC `fitmesh.fit-Performance-on-Search-2026-07-23` (3 mesi fino al 20/07/2026); al 25/08 in P1.8B: 3.192 imp, 22 clic, 0,69% CTR, pos 7,60 | `google health vs google fit`, `google fit shutdown 2026 what to use` · Intento: differenze e impatto transizione |
| 2 | `https://www.fitmesh.fit/en/blog/galaxy-ring-android-health-connect` | EN | `galaxy-ring-android-health-connect.ts` | 483 | 1 | 0,21% | 8,73 | GSC `fitmesh.fit-Performance-on-Search-2026-07-23` (3 mesi fino al 20/07/2026) | `galaxy ring android health connect`, `galaxy ring outside samsung health` · Intento: setup e compatibilità |
| 3 | `https://www.fitmesh.fit/it/blog/galaxy-ring-android-health-connect` | IT | `galaxy-ring-android-health-connect.ts` | *N/D* | *N/D* | *N/D* | *N/D* | *Non segmentato per questa URL nell'export 2026-07-23* (incluso per simmetria strutturale col troncamento a 99c) | `galaxy ring android health connect` · Intento: setup su Android |
| 4 | `https://www.fitmesh.fit/en/blog/oura-ring-health-connect-android` | EN | `oura-ring-health-connect-android.ts` | 404 | 1 | 0,25% | 10,75 | GSC `fitmesh.fit-Performance-on-Search-2026-07-23` (3 mesi fino al 20/07/2026) | `oura ring health connect android`, `sync oura data to android` · Intento: compatibilità e limitazioni sync |
| 5 | `https://www.fitmesh.fit/it/blog/garmin-samsung-health-sync-guide` | IT | `garmin-samsung-health-sync-guide.ts` | *N/D* | *N/D* | *N/D* | *N/D* | *Non segmentato per questa URL nell'export 2026-07-23* (presente cluster EN `sync-garmin-samsung-health-guide`: 712 imp, 7 clic, 0,98% CTR, pos 8,97; DE: 563 imp, 17 clic, 3,02% CTR, pos 6,94) | `sincronizzare garmin con samsung health` · Intento: procedura di sincronizzazione |

*Nota Dispositivo*: Il dato per singola URL non è segmentato nei report GSC di base (aggregato sitewide: mobile 66%, desktop 34%).

---

## 3. Schede Prima / Dopo dei Metadati Renderizzati

> **Comportamento Renderizzato**: `blog/[slug]/page.tsx` appende automaticamente ` · FitMesh` (10 caratteri) al tag `<title>`, all'OpenGraph title e a Twitter title. L'H1 visibile in pagina (`post.hero.title`) e il corpo dell'articolo **restano invariati**.

### URL 1: `https://www.fitmesh.fit/en/blog/google-health-replaces-google-fit`
* **Data Ultima Modifica nel Codice**: 2026-08-25 (PR #61)
* **Title Prima**:
  * Base: `"Google Health vs Google Fit: What Changed?"` (43c)
  * Renderizzato: `Google Health vs Google Fit: What Changed? · FitMesh` (53c)
* **Title Dopo**:
  * Base (`seoTitle.en`): `"Google Health vs Google Fit: What Changes in 2026"` (49c)
  * Renderizzato: `Google Health vs Google Fit: What Changes in 2026 · FitMesh` (**59c**)
* **Verifica Contenuto (Punto 3 del Mandato)**: L'articolo chiarisce che la migrazione dei dati consumer non è ancora attiva né confermata con data certa da Google (solo annunciata per fine 2026). Di conseguenza, "2026 Migration Guide" è stato **scartato** perché ingannevole. "What Changes in 2026" riflette fedelmente il contenuto dell'articolo (cambio nome app Fitbit, differenze Health Connect, transizione futura).
* **Meta Description**: Invariata (148c).

### URL 2: `https://www.fitmesh.fit/en/blog/galaxy-ring-android-health-connect`
* **Data Ultima Modifica nel Codice**: 2026-09-01 (PR #63)
* **Title Prima**:
  * Base (`hero.title.en`): `"Galaxy Ring on Android: setup, health data, and Health Connect sync"` (67c)
  * Renderizzato: `Galaxy Ring on Android: setup, health data, and Health Connect sync · FitMesh` (77c)
* **Title Dopo**:
  * Base (`seoTitle.en`): `"Galaxy Ring on Android: Setup & Health Connect Sync"` (51c)
  * Renderizzato: `Galaxy Ring on Android: Setup & Health Connect Sync · FitMesh` (**61c**)
* **Ipotesi di Lavoro**: La riduzione a 61c renderizzati mira a ridurre la probabilità di troncamento nei risultati di ricerca rispetto a 77c. L'effettiva visualizzazione integrale dipende dalla larghezza in pixel calcolata dai motori di ricerca.
* **Meta Description**: Invariata (152c).

### URL 3: `https://www.fitmesh.fit/it/blog/galaxy-ring-android-health-connect`
* **Data Ultima Modifica nel Codice**: 2026-09-01 (PR #63)
* **Title Prima**:
  * Base (`hero.title.it`): `"Galaxy Ring su Android: impostazione, dati di salute e sincronizzazione Health Connect"` (89c)
  * Renderizzato: `Galaxy Ring su Android: impostazione, dati di salute e sincronizzazione Health Connect · FitMesh` (99c)
* **Title Dopo**:
  * Base (`seoTitle.it`): `"Galaxy Ring su Android: Setup e Health Connect"` (48c)
  * Renderizzato: `Galaxy Ring su Android: Setup e Health Connect · FitMesh` (**58c**)
* **Ipotesi di Lavoro**: Con 99 caratteri renderizzati, la stringa supera ampiamente le soglie medie visibili su dispositivi mobili. Il titolo a 58c rende immediatamente leggibile l'argomento centrale.
* **Meta Description**: Invariata (160c).

### URL 4: `https://www.fitmesh.fit/en/blog/oura-ring-health-connect-android`
* **Data Ultima Modifica nel Codice**: 2026-09-01 (PR #63)
* **Title Prima**:
  * Base (`hero.title.en`): `"Oura Ring on Android: Health Connect sync and what data you can access"` (70c)
  * Renderizzato: `Oura Ring on Android: Health Connect sync and what data you can access · FitMesh` (80c)
* **Title Dopo**:
  * Base (`seoTitle.en`): `"Oura Ring on Android: Health Connect Sync Guide"` (47c)
  * Renderizzato: `Oura Ring on Android: Health Connect Sync Guide · FitMesh` (**57c**)
* **Ipotesi di Lavoro**: Compattazione del titolo da 80c a 57c renderizzati per anticipare l'intento guida e verificare l'impatto sul CTR.
* **Meta Description**: Invariata (154c).

### URL 5: `https://www.fitmesh.fit/it/blog/garmin-samsung-health-sync-guide`
* **Data Ultima Modifica nel Codice**: 2026-08-25 (PR #62)
* **Title Prima**:
  * Base (`hero.title.it`): `"Come sincronizzare Garmin con Samsung Health e Health Connect nel 2026"` (72c)
  * Renderizzato: `Come sincronizzare Garmin con Samsung Health e Health Connect nel 2026 · FitMesh` (82c)
* **Title Dopo**:
  * Base (`seoTitle.it`): `"Sincronizzare Garmin con Samsung Health (2026)"` (48c)
  * Renderizzato: `Sincronizzare Garmin con Samsung Health (2026) · FitMesh` (**58c**)
* **Ipotesi di Lavoro**: La variante tedesca usa una formula sintetica (`Garmin mit Samsung Health synchronisieren`) ed esibisce un CTR del 3,02%. La variante italiana a 82c renderizzati viene riallineata a 58c per verificare se una struttura più snella favorisca il click.
* **Meta Description**: Invariata (156c).

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
4. **Vincoli di Causalità**:
   * Il confronto temporale prima/dopo non dimostra da solo causalità: fattori esogeni (aggiornamenti algoritmici, fluttuazioni di mercato stagionali) possono alterare le metriche.
   * L'analisi dovrà obbligatoriamente normalizzare per la **posizione media** (es. un peggioramento di ranking deprime il CTR indipendentemente dalla bontà del titolo) e monitorare il **query mix** (verificando che le impression rimangano stabili per tipologia di query).

---

## Stato Git del Branch

* **Branch**: `seo/p0-ctr-optimization-5urls`
* **Base**: `origin/main` (`dc4aca4`)
* **Diff**: 4 file TypeScript di post del blog + `docs/seo/seo-results-log.md` + `docs/seo/p0-ctr-optimization-report.md`.
* **STOP**: Nessun merge eseguito. Il codice è pronto per la review finale.
