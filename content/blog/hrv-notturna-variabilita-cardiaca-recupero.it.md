---
title: "HRV notturna: come leggere la variabilità cardiaca per pianificare il recupero"
description: "L'HRV è una delle metriche più potenti che il tuo smartwatch raccoglie e una delle più fraintese. Cosa misura davvero, perché conta solo il trend non il valore singolo, e come usarla per decidere quando spingere e quando recuperare."
date: "2026-05-19"
author: "Team FitMesh"
tags: ["sport-science", "hrv", "recupero", "allenamento"]
---

L'HRV — Heart Rate Variability, variabilità cardiaca — è la metrica che più sta cambiando il modo in cui atleti amatoriali e professionisti gestiscono il carico di allenamento. Il tuo smartwatch probabilmente la misura ogni notte. Ma quasi tutti la guardano sbagliata.

Questa nota tecnica spiega cosa l'HRV misura davvero a livello fisiologico, perché il valore singolo dice poco e il trend dice tutto, e un framework operativo per usarla nelle decisioni di allenamento.

## Cos'è l'HRV (in 3 minuti, senza barare)

Il cuore non batte come un metronomo. Tra un battito e l'altro c'è una micro-variazione di tempo. Se hai una FC media di 60 bpm — un battito al secondo — gli intervalli reali non sono 1000ms-1000ms-1000ms, ma 980ms-1020ms-995ms-1010ms... Questa **variabilità tra intervalli RR** è l'HRV.

A controllare questa variabilità sono due rami del **sistema nervoso autonomo**:

- **Simpatico** (acceleratore): aumenta FC, riduce variabilità. Attivo sotto stress, sforzo, ansia, in fase di sveglia attiva.
- **Parasimpatico** (freno, nervo vago): rallenta FC, aumenta variabilità. Attivo in rilassamento, digestione, sonno profondo.

**HRV alta = parasimpatico dominante = corpo in modalità recupero.**
**HRV bassa = simpatico dominante = corpo sotto stress** (fisico, mentale, infettivo, ambientale).

L'HRV è quindi una **finestra non invasiva sullo stato del sistema nervoso autonomo**. Per questo è così potente: integra in un singolo numero il carico totale che il corpo sta gestendo, allenamento incluso ma non solo.

## Le unità che troverai

Ci sono diversi modi di misurare la variabilità, ti elenco i 3 più comuni:

- **RMSSD** (Root Mean Square of Successive Differences) — millisecondi. Cattura la variabilità a breve termine, dominio parasimpatico. È quella che usano Garmin, Whoop, Oura, Apple Watch, Polar. Range tipico: 20-100 ms (adulti).
- **SDNN** (Standard Deviation of NN intervals) — millisecondi. Cattura variabilità sia a breve che lungo termine, usata in contesti clinici (Holter). Range tipico più ampio: 30-200 ms.
- **HRV score** (Whoop, Oura, Garmin a volte) — numero 0-100 normalizzato sul tuo storico personale. Comodo per confronti soggettivi giorno-per-giorno, ma opaco perché copre la formula.

La maggior parte degli smartwatch consumer espone **RMSSD** o un derivato. È la più sensibile al recupero e quella su cui c'è più letteratura scientifica.

## Perché la misurazione notturna è l'unica che conta

Misurare HRV durante il giorno è quasi inutile: parli, ti muovi, ti emozioni, mangi, bevi caffè, ti agiti per traffico — tutto altera il valore. È rumore puro.

La misurazione **notturna durante il sonno profondo** invece è in condizioni controllate: stesso orario, stesso stato fisiologico, mente offline, nessuna interferenza muscolare. È l'unico contesto in cui puoi confrontare il valore di oggi con quello di ieri sapendo che la differenza è il segnale, non il rumore di misurazione.

Quasi tutti i wearable moderni fanno la misurazione automaticamente durante il sonno e ti danno il valore "HRV notturna" o "Recovery HRV". Se il tuo non lo fa nativamente, può essere che lo esponga via Connessione Salute (Android) o HealthKit (iOS) come `HEART_RATE_VARIABILITY_RMSSD` e una dashboard esterna può aggregarlo correttamente.

## Il valore singolo non significa nulla

Errore #1 di chi inizia: confrontare il proprio HRV con quello del collega o con "valori sani da tabella". Senza senso, per due ragioni:

1. **L'HRV ha enorme variabilità inter-individuale**. È influenzato da età, genere, genetica, allenamento storico. Atleti di endurance ben allenati hanno spesso HRV 70-90 ms. Sedentari 25-40 ms. Un valore di 55 ms può essere "alto" per uno e "basso" per un altro.

2. **L'HRV cambia con l'età**: cala mediamente del 10% per decennio dopo i 30. Una "tabella valori sani" prende in conto questo ma resta media di popolazione.

L'unica cosa che conta è **il tuo trend personale**. La domanda non è "il mio HRV è alto?", è: **"il mio HRV oggi rispetto alla mia baseline è alto o basso?"**.

## Baseline e deviazione: il framework operativo

Funziona così:

1. **Stabilisci una baseline personale**: media degli ultimi 30-60 giorni della tua HRV notturna. Servono almeno 30 giorni di misurazioni continuative.
2. **Calcola la deviazione standard** della tua HRV su quel periodo. Per la maggior parte delle persone, sta tra 5 e 15 ms.
3. **Confronta l'HRV di oggi con la baseline ± 1 deviazione standard**:
   - **Sopra baseline + 1 SD** → recupero ottimo, corpo pronto per stimolo intenso
   - **Entro baseline ± 1 SD** → giornata "neutra", esecuzione normale del piano
   - **Sotto baseline − 1 SD** → corpo sotto stress, ridurre intensità o passare a recovery attivo
   - **Sotto baseline − 2 SD per più giorni di fila** → overreaching o malattia in arrivo, fermarsi

Le dashboard più evolute (Whoop, Oura, Polar Vantage) fanno questo calcolo automaticamente e ti propongono un "readiness score". Ma il principio si può replicare a mano con qualsiasi app che esponga i dati HRV grezzi.

## Cosa fa scendere l'HRV (oltre l'allenamento)

L'HRV bassa NON significa solo "ho fatto troppo allenamento". Cala anche con:

- **Alcol** la sera prima — anche 1-2 bicchieri abbassano HRV del 15-25% la notte successiva
- **Cena tardi** o pesante — la digestione attiva tira il simpatico
- **Sonno scarso** o frammentato — meno tempo in fase profonda = meno tempo in recupero parasimpatico
- **Stress mentale acuto** — scadenze, conflitti, ansia
- **Disidratazione** — l'acqua influenza il volume plasmatico e quindi la modulazione cardiovascolare
- **Quota / altitudine** — passare da 0 a 2000m abbassa HRV per 2-3 giorni
- **Caffeina tardiva** — caffè dopo le 14 può influire sull'HRV notturna
- **Infezione in incubazione** — è uno dei primi segnali, precede febbre/sintomi di 1-2 giorni

Per questo l'HRV è particolarmente utile per **anticipare** problemi: un crollo di 20% rispetto alla baseline 2-3 giorni prima dei sintomi è spesso un'infezione virale che sta partendo. Tagliare l'allenamento di anticipo può ridurre la durata.

## L'errore opposto: ignorare l'HRV alta

Tanti atleti seri usano l'HRV solo per "frenare" (giorno basso → riposo). Ma è altrettanto importante usarla per **autorizzarsi a spingere quando i numeri lo permettono**.

Se per 3 giorni di fila la tua HRV è sopra baseline + 1 SD, FC riposo è bassa, percezione soggettiva di freschezza, sleep score buono → quella è la finestra in cui programmi la seduta di alta qualità: long run, intervalli alla soglia, palestra pesante. Sprecare quella finestra con un allenamento blando è quasi un peccato.

L'HRV è uno strumento bidirezionale: ti dice quando frenare E quando autorizzarti a fare di più.

## Un piano settimanale guidato da HRV (esempio runner amatoriale)

Per dare un esempio concreto, una settimana tipica gestita con HRV:

- **Lunedì** — HRV neutra → tempo run 40 min in zona 2-3 (recupero dal weekend)
- **Martedì** — HRV alta → intervalli VO₂ max (4×5 min)
- **Mercoledì** — HRV bassa post-intervalli → riposo o stretching
- **Giovedì** — HRV recuperata → soglia 3×10 min
- **Venerdì** — HRV neutra → easy 45 min zona 2
- **Sabato** — HRV alta → long run 1h30 con finish veloce
- **Domenica** — HRV bassa post-long → riposo o nuoto rigenerante

Questa è la **periodizzazione reattiva**: rispetti la struttura settimanale ma riarrangi i giorni in base allo stato reale del corpo invece che seguire ciecamente il piano. Più sostenibile, meno infortuni, miglioramenti più consistenti.

## In sintesi

L'HRV non è un numero magico. È una **finestra sulla bilancia simpatico-parasimpatico** del tuo sistema nervoso, leggibile in modo affidabile solo durante il sonno, utile solo come trend personale, non come valore assoluto.

Usata bene, è la metrica che ti permette di smettere di pensare l'allenamento come "ho fatto X ore questa settimana" e iniziare a pensarlo come "ho stimolato il corpo nel modo giusto rispetto alla sua capacità attuale di assorbire stress". Per chi si allena seriamente, è un cambio di paradigma.

E sì, il tuo Galaxy Watch ce l'ha. Spesso non te la mostra bene. Per quello servono dashboard che leggono il dato grezzo da Connessione Salute e lo plottano nel modo giusto: trend a 30 giorni, baseline mobile, deviazione standard sopra/sotto. Quello è il modo serio di usarla.
