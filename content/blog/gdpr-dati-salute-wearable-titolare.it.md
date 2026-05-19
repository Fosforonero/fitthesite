---
title: "I tuoi dati sanitari da wearable secondo il GDPR: chi è il titolare, davvero"
description: "Quando indossi uno smartwatch, chi è legalmente responsabile dei dati che genera? Una lettura chiara del GDPR (art. 9, 6, 17, 20) applicato ai wearable, senza legalese, per capire cosa puoi pretendere e da chi."
date: "2026-05-19"
author: "Team FitMesh"
tags: ["privacy", "gdpr", "wearable", "diritti-digitali"]
---

Indossi uno smartwatch da mesi. Genera ogni giorno migliaia di rilevazioni: frequenza cardiaca al secondo, fasi del sonno, sessioni di allenamento, peso, ciclo. Dati sensibilissimi. Domanda semplice: **chi è il titolare di quei dati?**

La risposta, sotto il GDPR, è meno scontata di quanto sembri. Non è "tu". Non è "il produttore dell'orologio". È un mosaico di responsabilità divise tra te (interessato), il produttore (titolare del trattamento), e qualsiasi app terza a cui hai dato accesso (contitolare o titolare separato a seconda dei casi). Vediamo come funziona davvero.

## Dati di salute = categoria particolare

Il GDPR all'**articolo 9** classifica i dati relativi alla salute come **"categorie particolari di dati personali"**. Sono nella stessa lista di: dati biometrici, dati genetici, orientamento sessuale, convinzioni religiose. Massima sensibilità, massima protezione.

Cosa significa in pratica:

- **Vietato trattarli** salvo eccezioni esplicite (consenso, necessità medica, ricerca, salute pubblica)
- **Consenso più stringente**: deve essere esplicito (non basta "continuando ad usare il servizio accetti…"), informato, granulare e revocabile
- **Misure di sicurezza tecnico-organizzative rafforzate**: cifratura, pseudonimizzazione, controllo accessi, audit log
- **Notifica violazioni più rigida**: data breach con dati sanitari va notificato al Garante entro 72h E agli utenti

I produttori di wearable e le app companion DEVONO conformarsi a tutto questo. Se non lo fanno, sono sanzionabili (fino al 4% del fatturato globale o 20M€, prevale il maggiore).

## Chi è il titolare? Il quadro reale

Il **titolare del trattamento** è chi decide finalità e mezzi del trattamento. Non sei tu, l'utente: tu sei l'**interessato**. Nella catena di un wearable il titolare è plurale:

**Il produttore del wearable** è titolare di:
- Dati raccolti dall'orologio durante la sincronizzazione con l'app companion (a volte anche dati non resi visibili nell'UI)
- Telemetria d'uso del dispositivo
- Dati di salute storicizzati sui propri server cloud (se l'app cloud-sync è attiva)

**L'app companion** (Samsung Health, Mi Fitness, Garmin Connect, ecc.) è titolare di:
- Tutto quello che mostra nell'UI
- Dati aggregati che invia ai propri server
- Spesso dati di geolocalizzazione (workout GPS, posizione casa/lavoro inferite)

**Le app terze a cui hai dato accesso** (es. una dashboard come FitMesh Sync, MyFitnessPal, Strava se collegata) sono titolari **autonomi** per i dati che ricevono. Il fatto che li abbiano letti dal tuo telefono via Connessione Salute non li scarica dalla responsabilità — diventano loro titolari quando li archiviano sui propri server.

**Connessione Salute / HealthKit** (rispettivamente Google e Apple) NON sono titolari dei tuoi dati, perché — secondo le loro stesse policy — i dati restano locali al telefono, cifrati, inaccessibili al sistema operativo. Sono **fornitori di infrastruttura**, non trattano i dati. Punto delicato che però regge legalmente.

## Il consenso che dai (spesso senza saperlo)

Quando attivi il tuo smartwatch e accetti i ToS dell'app companion, tipicamente acconsenti a:

1. **Trattamento dei dati salute per fornitura del servizio** (mostrarteli nell'app) — base giuridica: contratto / art. 6.1.b
2. **Trattamento per finalità ulteriori** — ricerca, miglioramento prodotto, marketing, condivisione con partner. Base giuridica: consenso art. 9.2.a. SPESSO opt-in per default in regioni non-EU, opt-in esplicito in EU.
3. **Trasferimento extra-UE** — molti backend sono in US, India, Corea. Richiede clausole contrattuali standard (SCC) post-Schrems II, sempre comunque problematico per dati salute.

Il punto critico: il consenso al #2 e #3 è **sempre revocabile** (GDPR art. 7.3). Vai nelle impostazioni privacy dell'app e cerca "Condivisione dati / Migliora il prodotto / Personalizzazione". Disattiva tutto quello che non ti serve. Cinque minuti, ti dimezzi la superficie di esposizione.

## I tuoi 6 diritti, in pratica

Il GDPR ti dà 6 diritti. Per i dati sanitari da wearable:

**1. Accesso (art. 15)**
Puoi chiedere all'app companion: "Quali miei dati hai, da quando, perché, per quanto, condivisi con chi?". L'app deve risponderti entro 30 giorni. Gratuita la prima richiesta annuale.

**2. Rettifica (art. 16)**
Se i dati sono sbagliati (peso registrato male, tipo workout errato), puoi chiederli corretti. Le app companion serie hanno l'edit in-app; quelle che non lo hanno, te lo devono fare via email.

**3. Cancellazione / "diritto all'oblio" (art. 17)**
Puoi chiedere la cancellazione totale dei tuoi dati. L'app deve farlo entro 30 giorni. Eccezioni: solo se richiesto da legge (es. dati clinici per legge italiana 10 anni), tutto il resto va cancellato. **Importante**: cancellare l'app dal telefono non equivale a chiedere cancellazione dati al backend. Devi farlo esplicitamente.

**4. Portabilità (art. 20)**
Puoi chiedere l'export di tutti i tuoi dati in **formato strutturato leggibile da macchina** (tipicamente JSON o CSV). Le app serie offrono export self-service in-app. Quelle che non lo offrono, te lo devono mandare entro 30 giorni dietro richiesta scritta.

**5. Limitazione del trattamento (art. 18)**
Puoi chiedere che i tuoi dati siano "messi in pausa" — conservati ma non trattati — mentre verifichi un'eventuale violazione o contesti la liceità.

**6. Opposizione (art. 21)**
Puoi opporti al trattamento per finalità di marketing o ricerca senza dover motivare. È sufficiente la tua opposizione.

## Cosa pretendere da un'app che maneggia i tuoi dati salute

In ordine di importanza:

1. **Privacy Policy leggibile in 5 minuti**. Se sono 40 pagine di legalese, è red flag (non per cattiveria — per pigrizia di chi l'ha scritta).
2. **Server in UE** (idealmente Frankfurt/Dublino). Se sono in US, deve esserci SCC + un buon motivo.
3. **Export self-service**. Bottone "Esporta tutti i miei dati" raggiungibile in 3 tap o meno dalle Impostazioni.
4. **Cancellazione self-service** entro 48h dichiarate. Bottone "Elimina account" che spiega cosa viene cancellato e quando.
5. **Granularità del consenso** — non un singolo "Accetto tutto", ma toggle per: analytics anonimi, personalizzazione, condivisione con partner, marketing.
6. **Niente tracker pubblicitari** (Google Analytics, Facebook Pixel, Hotjar) sulle pagine dove vedi i tuoi dati. È un test rapido — apri DevTools, vedi cosa carica.

## E se un'app non rispetta queste regole?

Hai due strade:

**Soft path** (provare prima): mail al DPO (Data Protection Officer) dell'azienda, deve essere indicato nella Privacy Policy. Spiega cosa contesti, cita gli articoli GDPR. Devono risponderti entro 30 giorni.

**Hard path** (se ignorano o rispondono male): reclamo al Garante per la protezione dei dati personali (garanteprivacy.it). Procedura gratuita, online, in italiano. Il Garante ha sanzionato molte app salute negli ultimi anni — sono nel radar.

## In sintesi

I dati che il tuo smartwatch genera **non sono "tuoi" in senso proprietario classico**, ma il GDPR ti riconosce un mosaico di diritti molto forti sull'uso che gli altri ne fanno. Il GDPR non vieta a un'app di trattarli — chiede che lo faccia con trasparenza, consenso esplicito, basi giuridiche chiare e che ti permetta di tirartene fuori in qualsiasi momento.

La domanda da fare a ogni app prima di darle accesso ai tuoi dati salute non è "dove sono i miei dati?". È: **"come escono i miei dati di qui se cambio idea domani?"**. La risposta a quella domanda separa le app serie dalle altre.
