---
title: "Galaxy Watch e Connessione Salute: cosa viene davvero esportato (e cosa no)"
description: "Il tuo Galaxy Watch raccoglie 30+ metriche, ma quante arrivano davvero a Connessione Salute e da lì alle app terze? Una mappatura precisa di cosa esce, cosa resta dentro Samsung Health, e come ottenere il massimo."
date: "2026-05-19"
author: "Team FitMesh"
tags: ["galaxy-watch", "samsung-health", "health-connect", "guide"]
---

Il tuo Galaxy Watch 4, 5, 6, 7 o Ultra è uno dei wearable più ricchi di sensori sul mercato consumer. Misura più di 30 metriche fisiologiche diverse — dalla saturazione ossigeno alla composizione corporea via bioimpedenza, dall'HRV notturna alla temperatura cutanea.

Ma se hai mai provato a leggere quei dati da un'app diversa da Samsung Health, ti sarai accorto che **non tutto arriva davvero in Connessione Salute**. C'è un layer di "perdita" tra quello che l'orologio raccoglie e quello che le app terze possono leggere. Questa nota è una mappa precisa di chi va dove.

## Il modello: tre cerchi concentrici

I dati del tuo Galaxy Watch vivono in tre posti, in ordine di accessibilità:

1. **Samsung Health (app)** — cerchio interno. Vede TUTTO quello che l'orologio raccoglie. È il primo destinatario.
2. **Connessione Salute** — cerchio medio. Samsung Health scrive lì un sottoinsieme di metriche, quello che decide di esporre. Le app terze leggono da qui.
3. **Samsung Health Data SDK** — cerchio interno bis. È un'API che Samsung offre a partner approvati per leggere dati più ricchi di quelli esposti a Connessione Salute. Richiede registrazione developer + approval.

Vediamo nel dettaglio cosa c'è in ogni cerchio.

## Cerchio 1: Samsung Health vede tutto

Dentro Samsung Health (l'app preinstallata sul telefono che si parla col tuo Watch via Bluetooth) hai accesso a tutto quello che il dispositivo misura:

**Cardio**
- FC continua o spot, FC a riposo, FC media giornaliera
- HRV notturna (RMSSD)
- ECG (Watch 4+ con licenza paese)
- VO₂ max stimato

**Sonno**
- Durata totale, durata fasi (REM, leggero, profondo, sveglio)
- Sleep Score (algoritmo proprietario Samsung)
- Snoring detection (Watch 4+)
- Temperatura cutanea durante il sonno
- Saturazione ossigeno (SpO₂) spot e continua durante il sonno

**Activity**
- Passi (anche giornalieri storici lunghi)
- Distanza, calorie attive, calorie totali
- Piani saliti, dislivello cumulato
- Sessioni di esercizio rilevate manualmente o auto-detect (running, cycling, swimming, ecc.)

**Body composition** (solo Watch 4+ con Galaxy Watch BIA)
- Massa grassa %, massa magra
- Acqua corporea, muscolatura scheletrica
- Metabolismo basale calcolato

**Stress & wellness**
- Stress score basato su HRV continua
- Periodi di stress alto/basso registrati nel giorno
- Mindfulness session log (se usi l'app respirazione)

Tutto questo è dentro Samsung Health, sul tuo telefono. Cloud-sync su Samsung Cloud opzionale.

## Cerchio 2: cosa Samsung Health scrive in Connessione Salute

Qui inizia la perdita. Samsung Health scrive in Connessione Salute un sottoinsieme:

**Tutto esportato (ricchezza pari al cerchio 1)**
- Passi, distanza, calorie attive/totali, piani saliti, dislivello
- Sessioni di esercizio (start/end, tipo, durata, distanza, calorie, FC media/max)
- Sonno con fasi
- FC continua e a riposo
- SpO₂ spot
- HRV (RMSSD)
- Peso (se sincronizzato)
- VO₂ max

**Esportato ma con perdita di dettaglio**
- Sessioni esercizio: la FC intraday per workout viene esportata, ma alcuni dettagli come la cadenza media o le zone di FC dettagliate possono restare solo dentro Samsung Health
- Stress: lo score giornaliero non è uno standard di Connessione Salute, quindi non viene esportato come tipo dedicato (ma puoi inferire qualcosa dai dati HRV)
- Sleep Score: stesso discorso — il numero proprietario Samsung non viaggia, viaggiano le metriche grezze (durata fasi, FC notturna, SpO₂)

**Non esportato**
- ECG (anche per ragioni regolatorie — è un dato medico-clinico)
- Snoring detection
- Body composition dettagliata (Connessione Salute prende peso e BMI ma non il breakdown massa grassa/magra dalla maggior parte dei dispositivi)
- Temperatura cutanea continua (a volte sì a volte no, dipende dalla versione Samsung Health)
- Microeventi tipo "Galaxy Watch ha rilevato che ti sei alzato dopo X minuti di sedentarietà"
- Cardio score (proprietario)

Per la maggior parte delle dashboard terze, questo significa che ottieni il **90% delle metriche core** ma perdi alcuni dati premium specifici di Samsung.

## Cerchio 3: Samsung Health Data SDK (il livello premium)

Per le app terze che vogliono superare le limitazioni di Connessione Salute esiste un'alternativa: **Samsung Health Data SDK**. È un'API che dà accesso diretto ai dati Samsung Health bypassando Connessione Salute. Cosa ottieni in più:

- **HRV notturna RMSSD continua** (campioni ogni X minuti, non solo aggregato giornaliero)
- **SpO₂ continua** durante il sonno (non solo spot)
- **Fasi sonno granulari** con timestamp precisi per ogni transizione
- **Temperatura pelle continua** (ogni X minuti)
- **Cadenza media** per sessione esercizio
- **Zone FC dettagliate** per workout
- **Resting HR** misurata vs calcolata

Per averlo, una dashboard deve:
1. Registrare l'app sul Samsung Developer Portal
2. Sottometter richiesta di accesso al Samsung Health Data SDK
3. Ricevere approval (tempi 2-4 settimane, simili a Garmin Health API)
4. Implementare l'SDK come integrazione separata da Connessione Salute

Le dashboard ben fatte fanno quindi **lettura ibrida**: Connessione Salute come base universale (funziona per qualsiasi brand) + Samsung Health Data SDK come "bonus" per chi ha Galaxy Watch (più ricchezza dati). È il pattern che FitMesh Sync adotta.

## Come ottenere il massimo dal tuo Galaxy Watch — checklist

Se vuoi che i tuoi dati Galaxy Watch arrivino completi a una dashboard esterna, fai questi 5 passi:

1. **Aggiorna Samsung Health all'ultima versione**. Le versioni vecchie esportano meno tipi di dato. La maggior parte degli utenti ha auto-update attivo, ma vale la verifica.

2. **Autorizza Samsung Health a scrivere su Connessione Salute**. Apri Samsung Health → Tre puntini → Impostazioni → Connessione Salute → autorizza scrittura per i tipi che ti interessano (di default sono autorizzati i principali, ma SpO₂ e HRV a volte vanno attivati esplicitamente).

3. **Indossa l'orologio durante la notte**. La maggior parte delle metriche premium (HRV notturna, SpO₂ continua, fasi sonno, temperatura pelle) vengono raccolte solo durante il sonno. Senza, vedi solo i dati diurni.

4. **Autorizza la dashboard esterna a leggere "in background"**. Connessione Salute → App connesse → [nome dashboard] → attiva "Lettura in background". Senza, vedi dati aggiornati solo quando apri la dashboard.

5. **Se la dashboard supporta Samsung Health Data SDK** (vedi pagina compatibilità della dashboard stessa), autorizza ANCHE quello in aggiunta a Connessione Salute. Doppia sorgente = ricchezza massima.

## Quirk noti del Galaxy Watch via Connessione Salute

Alcuni bug pattern che ti farai conoscenza presto:

**Sleep duplicati**. Samsung Health a volte scrive la stessa sessione di sonno 2 volte in Connessione Salute (esattamente stesso start_ms/end_ms/fase). Le dashboard serie deduplicano esplicitamente per tuple (start, end, stage).

**Steps con doppio conteggio**. Galaxy Watch + Samsung Health spesso scrive sia il totale cumulativo del giorno (00:00-now) sia i singoli bucket attività (15-60min). Sommare tutti = doppio conteggio. Le dashboard serie hanno logica di disambiguazione cumulativo vs delta.

**Calorie ambigue al mattino**. Il campo `caloriesKcal` di Connessione Salute a volte contiene solo ACTIVE, a volte TOTAL (BMR + active). Dipende da come Samsung Health aggrega quel giorno. Al mattino presto può sembrare di aver bruciato calorie attive prima di muoversi — è un artifact del payload, non realtà.

**Workout types non normalizzati**. Samsung Health usa un suo enum di sport types (es. "WORKOUT" generico, "RUNNING", "FITNESS_DANCE"). Le dashboard devono normalizzare allo schema Connessione Salute per evitare di mostrare "fitness_dance" come tipo workout illeggibile.

Queste cose non sono colpa del Galaxy Watch — sono il prezzo dell'astrazione. Una dashboard ben costruita le gestisce, una pigra te le rifila come sono.

## In sintesi

Il tuo Galaxy Watch ha sensori migliori della maggior parte dei wearable in commercio. La buona notizia: **circa il 90% delle metriche significative arriva a Connessione Salute** e quindi a qualsiasi dashboard terza ben fatta. La cattiva: il 10% premium (HRV continua, SpO₂ continua, body composition dettagliata) richiede integrazione Samsung Health Data SDK separata, che pochi sviluppatori fanno per pigrizia o impossibilità di passare l'approval.

Se cerchi una dashboard alternativa a Samsung Health per il tuo Galaxy Watch, due cose da controllare:

1. Legge da Connessione Salute? (minimo sindacale, dovrebbe essere ovvio)
2. Ha anche integrazione Samsung Health Data SDK? (massimo della ricchezza dati, separa le dashboard serie dalle altre)

Il resto sono dettagli.
