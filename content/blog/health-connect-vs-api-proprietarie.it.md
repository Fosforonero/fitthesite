---
title: "Health Connect vs API proprietarie: cosa cambia per i tuoi dati"
description: "Health Connect è l'hub salute di Android. Le API proprietarie dei produttori esistono ancora e a volte sono più ricche. Quando conviene una, quando l'altra, e perché la differenza non è solo tecnica."
date: "2026-05-19"
author: "Team FitMesh"
tags: ["tecnica", "health-connect", "android", "salute-digitale"]
---

Se hai mai connesso uno smartwatch a un'app di terze parti, hai incontrato due strade: passare per **Health Connect** (l'hub salute di Android) o passare per **un'API proprietaria** del produttore (Samsung Health Data SDK, Apple HealthKit su iOS, l'SDK Garmin Health, ecc.). Le due strade portano a posti diversi, anche quando sembra che siano la stessa cosa.

Questo articolo entra nel dettaglio tecnico delle differenze, perché impattano sui dati che vedi nella tua dashboard, e quando una scelta è migliore dell'altra.

## Cos'è Health Connect

**Health Connect** è un servizio Android sviluppato da Google con la collaborazione di Samsung. Lanciato in beta nel 2022, stabile su Android 14 (2023), preinstallato dal 14 in poi. È un **database locale crittografato** sul telefono che fa da intermediario standardizzato per tutti i dati salute.

Le app possono:

- **Scrivere** (di solito le app companion degli smartwatch, le bilance Bluetooth, le app fitness)
- **Leggere** (di solito le dashboard, gli aggregatori, le app medicali)
- **Cancellare** (l'utente ha controllo granulare per app + per tipo dato)

Il protocollo è standardizzato: una metrica come "heart rate" ha sempre lo stesso schema (valore, timestamp, sorgente), indipendentemente da chi ha scritto. Questo è il valore: **fa parlare gli ecosistemi tra loro**.

## Cos'è un'API proprietaria

Un'API proprietaria è invece l'integrazione diretta con il SDK di un singolo produttore. Esempi:

- **Samsung Health Data SDK** (Android) — accesso ai dati raccolti da Samsung Health, inclusi dati che NON vengono esposti a Health Connect
- **Apple HealthKit** (iOS) — equivalente Apple, è l'unico modo per accedere ai dati salute su iOS
- **Garmin Health API** (cloud-side) — i dati dei Garmin Connect, accessibili dopo OAuth + approvazione partner di Garmin
- **Strava API**, **Oura API**, **Suunto API** — pattern simile a Garmin, OAuth cloud-side

L'API proprietaria di solito ti dà **dati più ricchi** ma costringe a **una integrazione separata per ogni produttore**.

## Le differenze pratiche

### 1. Ricchezza dei dati

Health Connect ha uno schema standardizzato che copre le metriche comuni (passi, battito, sonno, calorie, distanza, peso, ciclo, SpO₂, HRV). Ma non tutte le sorgenti riempiono tutti i campi. Esempi reali:

- **Mi Fitness** (Xiaomi) scrive passi, battito medio, sonno totale, calorie. Non scrive SpO₂ né HRV anche se l'orologio li misura.
- **Garmin Connect** scrive passi, sonno, battito ma non VO₂ max né allenamenti dettagliati.
- **Samsung Health** scrive tutto su Health Connect tranne alcune metriche avanzate (segmenti running per zona di battito, dettaglio swimming) che restano solo nell'SDK proprietario.

Quindi: per una dashboard che vuole **massima profondità sui Galaxy Watch**, l'integrazione diretta col Samsung Health Data SDK porta più valore dell'integrazione solo con Health Connect. Per una dashboard che vuole **massima copertura cross-brand**, Health Connect è la base e i SDK proprietari sono il "bonus" per i brand top.

### 2. Privacy e dove vivono i dati

Health Connect è **locale sul telefono**, crittografato dal Keystore Android. Le app che vi scrivono non vedono cosa scrive un'altra app (a meno che l'utente conceda permesso esplicito di lettura). Quando cancelli i dati da Health Connect, sono cancellati davvero.

Le API cloud-side (Garmin, Strava, Oura) **passano dal cloud del produttore**. La dashboard di terze parti riceve i dati tramite il cloud del produttore, che ha già letto e archiviato i tuoi dati. Anche se tu cancelli i dati dalla dashboard, i dati restano sul cloud del produttore.

Per chi mette la privacy al primo posto, Health Connect è strutturalmente più pulito. Le API cloud-side richiedono di **fidarsi anche del cloud del produttore originale**.

### 3. Real-time e cadenza di aggiornamento

- **Health Connect**: aggiorna quando le app companion scrivono. Tipicamente ogni 5-15 minuti, ma dipende dalla policy dell'app companion. Non c'è push event al consumer.
- **SDK proprietari** (Samsung, Apple): possono fare push reattivi a nuovi dati con callback. Migliore per dashboard real-time.
- **API cloud (Garmin, Strava)**: hanno webhook per notifiche push, ma c'è latency cloud (qualche minuto). Per dati intraday tipicamente meno fresche di Health Connect.

### 4. Setup utente

- **Health Connect**: l'utente concede permessi una volta. La dashboard funziona finché Health Connect funziona.
- **SDK proprietari Android**: stessa cosa, permessi in-app.
- **API cloud OAuth**: l'utente deve fare login col produttore (Strava, Garmin) e autorizzare l'accesso. Più friction, ma necessario per ecosistemi cloud-first.

### 5. Approvazione e developer overhead

Per accedere a Health Connect basta una libreria gratuita Google. Niente approvazione.

Per accedere alla **Garmin Health API**, devi sottometter una richiesta a Garmin con il use case e attendere 2-4 settimane di approvazione. Stesso per **Fitbit Web API** e altri grandi cloud-side. Questo limita quali dashboard possono usare quei dati.

## Quando usare cosa

Riassumendo le scelte:

| Scenario | Strada consigliata |
|---|---|
| Dashboard cross-brand su Android | Health Connect come base |
| Massima profondità su Galaxy Watch | Health Connect + Samsung Health Data SDK |
| Dashboard real-time durante allenamento | SDK proprietario specifico (Samsung, Apple) |
| Privacy-first / GDPR strict | Health Connect (evita cloud-side se possibile) |
| Aggregare dati Strava/Garmin in dashboard | API cloud OAuth (è l'unica via) |
| iOS | HealthKit (è l'unica via per smartwatch Apple) |

## Come fa FitMesh Sync

Per trasparenza, le scelte tecniche di FitMesh Sync (2026):

- **Android**: integrazione primaria con **Health Connect** (copre 13+ brand). Per Galaxy Watch, in aggiunta, lettura diretta dal **Samsung Health Data SDK** per ottenere SpO₂ notturna, HRV continua, fasi sonno granulari che il bridge Samsung Health → Health Connect non espone tutti.
- **iOS**: in roadmap per fine 2026, integrazione **HealthKit**.
- **Strava, Oura, Suunto**: integrazione cloud-side OAuth in arrivo nel 2026 per chi vuole vedere workout di queste piattaforme accanto ai dati Health Connect.
- **Garmin**: API approval in corso (2-4 settimane attese).

La filosofia è: **usiamo Health Connect come base universale + SDK proprietari come bonus per ricchezza dati su brand specifici, no cloud-side dove evitabile** per minimizzare le terze parti coinvolte.

## In sintesi

Health Connect non è "meglio" o "peggio" delle API proprietarie. È **una base standard** che semplifica enormemente lo sviluppo cross-brand e ha vantaggi strutturali sulla privacy. Le API proprietarie restano necessarie per:

1. Ricchezza dati specifica brand (Samsung, Apple, Garmin)
2. Piattaforme cloud-first come Strava, Oura, Fitbit
3. iOS (HealthKit è l'unica via)

Una dashboard ben fatta dovrebbe usare Health Connect come base e aggiungere SDK proprietari quando portano valore reale — non per moda né per marketing.
