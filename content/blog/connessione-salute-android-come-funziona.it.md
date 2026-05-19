---
title: "Connessione Salute su Android: cosa entra, cosa esce, cosa resta sul telefono"
description: "Una guida tecnica ma leggibile a Connessione Salute (Health Connect): come funziona davvero, quali dati entrano e da chi, chi può leggerli, dove vivono e cosa non lascia mai il telefono."
date: "2026-05-19"
author: "Team FitMesh"
tags: ["tecnica", "health-connect", "android", "privacy"]
---

Da Android 14, sul tuo telefono c'è un'app che probabilmente non hai mai aperto e che però è il **centro di gravità** di tutti i tuoi dati di salute: **Connessione Salute** (Health Connect, in inglese). Sta lì, fa da archivio comune, e detta le regole su chi può leggere cosa.

Questa guida spiega — senza scorciatoie ma senza gergo — cosa Connessione Salute è davvero, come funziona la pipeline tra il tuo smartwatch e le app che leggono, e perché capirla cambia il modo in cui scegli un'app di salute.

## Cos'è Connessione Salute, in una frase

Connessione Salute è un **database locale crittografato** preinstallato su Android dal 14 in poi (scaricabile su versioni precedenti) che fa da intermediario standardizzato tra:

- **app che scrivono** (le app companion degli smartwatch, le bilance Bluetooth, le app fitness, le app di nutrizione)
- **app che leggono** (le dashboard come FitMesh Sync, gli aggregatori, le app medicali)

L'idea: una sola interfaccia standard, anziché 12 SDK proprietari diversi. Una metrica come "frequenza cardiaca" ha sempre lo stesso schema (valore, timestamp, sorgente), chiunque l'abbia scritta.

## Cosa entra in Connessione Salute

Lo schema standard copre **decine di tipi di dato**, raggruppati in tre famiglie:

**Activity & fitness**
- Passi, distanza, calorie attive, calorie totali, piani saliti, dislivello cumulato
- Sessioni di esercizio (corsa, bici, nuoto, palestra, ecc.) con start/end, tipo, durata, distanza, calorie, FC media/max
- Dati intraday di FC (battito per battito o aggregato a campione)
- Cadenza, velocità, potenza (per i wearable più avanzati)

**Sleep & recovery**
- Sessioni di sonno con start/end e fasi (REM, profondo, leggero, sveglio)
- HRV (variabilità cardiaca) — soprattutto la misurazione notturna
- Frequenza cardiaca a riposo (resting HR)
- Saturazione ossigeno (SpO₂), spot o continua

**Body & vital**
- Peso, altezza, BMI (calcolato), massa grassa/magra (se la bilancia li espone)
- Temperatura corporea / temperatura pelle
- Glicemia, pressione sanguigna, ciclo mestruale
- Ossigeno consumato (VO₂ max)

Importante: **non tutte le sorgenti scrivono tutti i campi**. Un Galaxy Watch via Samsung Health scrive ~30 metriche. Un Pixel Watch via Fitbit ne scrive ~15. Una bilancia Bluetooth scrive solo peso + composizione. Ogni app companion decide cosa esporre, e questo è il primo punto sensibile.

## Chi può scrivere

Qualunque app installata sul telefono che dichiari nel manifest il permesso di scrittura per i tipi di dato specifici **e** che l'utente abbia autorizzato esplicitamente. Esempi del 2026:

- **Samsung Health** (Galaxy Watch, Galaxy Fit) — scrittura completa
- **Mi Fitness** (Xiaomi Watch, Smart Band, Redmi Watch) — passi, FC media, sonno, calorie
- **Zepp App** (Amazfit, Zepp) — integrazione ufficiale
- **Garmin Connect** — passi, sonno, FC (no VO₂ max ancora)
- **Fitbit** (Versa, Charge, Pixel Watch) — passi, sonno, FC
- **Polar Flow**, **Suunto**, **Coros**, **Withings Health Mate**, **Oura** — tutti integrati

Sono app che parlano con il loro hardware via Bluetooth, ricevono dati, li interpretano, e poi li scrivono in Connessione Salute con il loro nome come **sorgente**.

## Chi può leggere

Stessa logica, ma per la lettura serve un permesso esplicito **per ogni tipo di dato** che l'app vuole vedere. La prima volta che apri una nuova dashboard (es. FitMesh Sync), ti viene presentata una schermata Connessione Salute che elenca:

> "FitMesh Sync vuole leggere: passi, frequenza cardiaca, sonno, calorie attive, calorie totali, distanza, SpO₂, HRV, VO₂ max, sessioni di esercizio."

E tu autorizzi quelle che vuoi. Le altre, l'app non le vedrà mai. Puoi cambiare idea in qualsiasi momento da: **Impostazioni → Connessione Salute → App connesse → [nome app] → Permessi**.

C'è un permesso speciale che spesso confonde: **lettura in background**. Senza, la dashboard può sincronizzare solo quando è aperta in foreground. Con, può sincronizzare anche mentre il telefono è in tasca. Per una dashboard automatica è essenziale concederlo.

## Cosa resta sul telefono — e cosa no

Qui sta il punto privacy-first di Connessione Salute, e va capito bene:

**Tutto quello che è dentro Connessione Salute è LOCALE sul telefono.** Cifrato dal Keystore Android (hardware-backed sui modelli recenti), inaccessibile da altre app senza permesso esplicito, mai inviato a Google né a terzi.

Quando un'app **legge** da Connessione Salute, riceve i dati in memoria sul telefono. Cosa fa poi con quei dati dipende dall'app:

- Una dashboard che mostra solo grafici locali → i dati non lasciano il telefono
- Una dashboard cloud-based (la maggior parte delle app commerciali) → l'app **invia** i dati al proprio backend per persistenza, sync multi-device, analytics
- Una dashboard self-hosted → l'app invia i dati al server che hai configurato tu

**Connessione Salute non controlla cosa fa l'app con i dati dopo averli letti.** Quel passo dipende da chi hai scelto. Per questo conta sapere dove va a finire il dato dopo aver lasciato il telefono, non solo dove si trova mentre è sul telefono.

Quando **cancelli** dati da Connessione Salute (Impostazioni → Connessione Salute → Dati e accesso → tipo dato → Elimina), li elimini dal database locale. Ma **non** dai backend delle app che li avevano già letti e archiviati. Per quello devi cancellare separatamente da ogni app (GDPR art. 17 ti dà diritto a chiederlo formalmente).

## Il modello permessi in pratica

Tre regole utili da ricordare:

1. **Scrittura ≠ lettura.** Un'app può scrivere senza poter leggere, e viceversa. Il manifest Android dichiara intent, l'utente concede o nega.

2. **Permesso per tipo, non per app.** Puoi dare a FitMesh Sync il permesso di leggere passi e battito ma non SpO₂. Granularità totale.

3. **Auto-revoca dopo inattività.** Se un'app non legge un certo tipo di dato per 90+ giorni, Connessione Salute revoca automaticamente il permesso. Devi riconcederlo se riapri l'app dopo lungo tempo.

## Quirk noti (che troverai presto se entri nel mondo)

Qualche bug pattern che capita di incontrare:

- **Sleep segments duplicati.** Stessa sessione (start_ms, end_ms, fase) può apparire 2 volte. Le dashboard serie deduplicano esplicitamente.
- **Steps doppi: cumulativo + intraday.** Samsung Health a volte scrive sia il totale giornaliero che i singoli bucket attività. Sommarli ciecamente = doppio conteggio. Le dashboard serie usano logica di disambiguazione.
- **Calorie ambigue.** Il campo `calories_kcal` a volte è TOTAL (BMR + active), a volte solo ACTIVE. Dipende dalla sorgente. Le dashboard ben fatte preferiscono il campo esplicito `active_calories_kcal` quando disponibile.
- **Timezone.** I timestamp sono UTC, ma il "giorno" da visualizzare dipende dalla tua timezone. Capita di vedere dati del giorno X mostrati il giorno Y se la logica di raggruppamento fa male.

Questi non sono bug di Connessione Salute, sono bug delle app che la usano male. Capirli aiuta a scegliere chi è serio e chi no.

## Cosa puoi fare oggi (3 azioni utili)

1. **Apri Connessione Salute** e fai un audit: vai in **Dati e accesso → Visualizza tutti i dati**. Vedrai quali tipi sono popolati e da quale sorgente. Se ci sono fonti che non riconosci, indagale.

2. **Audit app connesse**: **Connessione Salute → App connesse**. Vedi chi ha quali permessi. Revoca quelli che non ti servono più. Disconnetti app che hai disinstallato da tempo (Connessione Salute non se ne accorge sempre).

3. **Concedi "lettura in background"** alla dashboard che usi davvero. È il singolo permesso che fa la differenza tra "vedo dati solo quando apro l'app" e "vedo dati sempre aggiornati".

## In sintesi

Connessione Salute non è un'app che usi. È **un'infrastruttura** che decide chi vede cosa sul tuo telefono. Capirla cambia due cose:

- Sai a chi stai davvero dando i tuoi dati (non a "Connessione Salute", ma alle app che hai autorizzato a leggere da lì)
- Sai cosa controllare nelle Impostazioni se qualcosa non torna (permessi, fonti, dati duplicati)

Per chi vuole portare seriamente i propri dati di salute fuori dalle app proprietarie e dentro una dashboard tua, Connessione Salute è l'unica strada pulita su Android oggi. Il resto è ginnastica.
