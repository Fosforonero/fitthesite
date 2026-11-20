import type { BlogPost } from "../types";

// Source locale: it. Localised from the short release article into en.
// Release source: build 192 (a4a9162bd) and the FitMesh release post linked below.
export const post: BlogPost = {
  slug: "fitmesh-sync-3-11-0",
  category: "news",
  publishedAt: "2026-11-20",
  updatedAt: "2026-11-20",
  organizationAuthor: true,
  declaredEnglishFallback: true,
  readMinutes: 3,
  hero: {
    kicker: { it: "Novità", en: "What's new" },
    title: {
      it: "FitMesh Sync 3.11.0: sonno, grafici e misure",
      en: "FitMesh Sync 3.11.0: sleep, charts, and measurements",
    },
    subtitle: {
      it: "Se dormi di notte e fai un pisolino nel pomeriggio, FitMesh Sync 3.11.0 somma entrambi nel totale del giorno, senza contare le pause da sveglio. Nel grafico della sessione, le fasi del sonno e il battito seguono la stessa scala oraria.",
      en: "If you sleep overnight and take an afternoon nap, FitMesh Sync 3.11.0 counts both in your daily total and leaves out awake breaks. In the session chart, sleep stages and heart rate share a timeline.",
    },
  },
  seoTitle: {
    it: "FitMesh Sync 3.11.0: sonno, grafici e misure",
    en: "FitMesh Sync 3.11.0: sleep, charts, and measurements",
  },
  primaryKeyword: { it: "FitMesh Sync 3.11.0", en: "FitMesh Sync 3.11.0" },
  secondaryKeywords: { it: ["FitMesh Sync build 192"], en: ["FitMesh Sync build 192"] },
  metaDescription: {
    it: "FitMesh Sync 3.11.0 somma notte e pisolini. La build 192 allinea fasi e battito nel grafico del sonno e aggiorna le viste per HRV, passi e pressione.",
    en: "FitMesh Sync 3.11.0 counts sleep and naps together. Build 192 puts sleep stages and heart rate on one chart and updates HRV, steps, and blood pressure views.",
  },
  coverAlt: {
    it: "Illustrazione di una persona con uno smartwatch che apre le tende in una camera luminosa, con un telefono sul comodino.",
    en: "Illustration of a person wearing a smartwatch and opening the curtains in a sunny bedroom, with a phone on the bedside table.",
  },
  related: ["efficienza-del-sonno-formula-calcolo", "novita-giorni-passati"],
  sources: ["https://www.reddit.com/r/FitMesh/comments/1y0zagl/fitmesh_sync_new_update_is_on_its_way_to_the/"],
  sourcesRenderedInline: true,
  body: [
    { type: "paragraph", text: {
      it: "Per verificare se la build 192 è disponibile sul tuo telefono, apri la scheda di FitMesh Sync su [Google Play](https://play.google.com/store/apps/details?id=com.fitmeshsync.app) o sull’[App Store](https://apps.apple.com/app/id6779751708). Trovi le note di rilascio anche su [Reddit](https://www.reddit.com/r/FitMesh/comments/1y0zagl/fitmesh_sync_new_update_is_on_its_way_to_the/).",
      en: "To check whether build 192 is available on your phone, open the FitMesh Sync listing on [Google Play](https://play.google.com/store/apps/details?id=com.fitmeshsync.app) or the [App Store](https://apps.apple.com/app/id6779751708). You can also find the release notes on [Reddit](https://www.reddit.com/r/FitMesh/comments/1y0zagl/fitmesh_sync_new_update_is_on_its_way_to_the/).",
    } },
    { type: "heading", level: 2, text: { it: "Come leggere il grafico del sonno", en: "How to read the sleep chart" } },
    { type: "paragraph", text: {
      it: "Se ti svegli nel mezzo della notte, puoi vedere dove si interrompe il sonno e guardare il battito in quel tratto, se il dispositivo lo ha registrato. Quando le letture ci sono, il riepilogo mostra anche la frequenza cardiaca minima, massima e media della sessione.",
      en: "If you wake up in the middle of the night, you can see where your sleep was interrupted and check your heart rate at that point if your device recorded it. The session summary also shows your lowest, highest, and average heart rate when those readings are available.",
    } },
    { type: "paragraph", text: {
      it: "Per capire la differenza tra tempo a letto e tempo dormito, vedi la [guida all’efficienza del sonno](/it/blog/efficienza-del-sonno-formula-calcolo).",
      en: "Our [guide to sleep efficiency](/en/blog/sleep-efficiency-formula-calculation) explains the difference between time in bed and time asleep.",
    } },
    { type: "heading", level: 2, text: { it: "Temperatura, HRV e ossigenazione", en: "Temperature, HRV, and blood oxygen" } },
    { type: "paragraph", text: {
      it: "Con gli anelli compatibili che forniscono queste letture, puoi vedere la temperatura cutanea e la variabilità della frequenza cardiaca (HRV) durante la giornata e il sonno. La linea del grafico HRV unisce solo le ore consecutive con un orario verificato. Dove manca una lettura, resta un buco.",
      en: "If your supported ring provides these readings, you can see skin temperature and heart rate variability (HRV) throughout the day and during sleep. The HRV line connects only consecutive hours with verified timestamps. Where a reading is missing, the chart leaves a gap.",
    } },
    { type: "paragraph", text: {
      it: "SpO₂ e frequenza respiratoria compaiono nelle viste delle 24 ore e del sonno se la fonte fornisce letture con orario. Con gli anelli compatibili, ogni barra oraria della SpO₂ mostra il minimo e il massimo rilevati in quell’ora.",
      en: "SpO₂ and respiratory rate appear in the 24-hour and sleep views if your source provides readings with timestamps. On supported rings, each hourly SpO₂ bar shows the lowest and highest values recorded in that hour.",
    } },
    { type: "heading", level: 2, text: { it: "Accesso all’app e correzioni su iPhone", en: "Sign-in and iPhone fixes" } },
    { type: "paragraph", text: {
      it: "La build 192 corregge un problema che poteva disconnetterti al ritorno nell’app o dopo un rinnovo non riuscito della sessione. Su iPhone, interviene sui casi segnalati di temperatura notturna del polso e SpO₂ mancanti. Se il VO₂ max è presente nell’app Salute di Apple, puoi abilitarne la visualizzazione nelle impostazioni di FitMesh.",
      en: "Build 192 fixes an issue that could sign you out when you returned to the app or when your session failed to refresh. On iPhone, it addresses reports of missing overnight wrist temperature and SpO₂ readings. If VO₂ max is available in Apple Health, you can turn on its display in FitMesh settings.",
    } },
    { type: "heading", level: 2, text: { it: "Allenamenti, passi e pressione", en: "Workouts, steps, and blood pressure" } },
    { type: "paragraph", text: {
      it: "Nell’elenco e nel dettaglio degli allenamenti puoi vedere da dove arrivano i dati della sessione. Per i passi puoi passare dal conteggio per ora al totale progressivo e vedere quanti giorni comparabili sono entrati nella media. La scheda delle calorie indica quando un valore è stimato.",
      en: "The workout list and session details show where the session data came from. For steps, you can switch between hourly counts and the running total, and see how many comparable days went into the average. The calorie card labels estimated values.",
    } },
    { type: "paragraph", text: {
      it: "In Misure puoi registrare una lettura della pressione e aprirne il dettaglio dal grafico.",
      en: "In Measurements, you can log a blood pressure reading and open its details from the chart.",
    } },
    { type: "heading", level: 2, text: { it: "A cosa stiamo lavorando", en: "What we’re working on" } },
    { type: "paragraph", text: {
      it: "Stiamo lavorando a nuove integrazioni per Huawei e Garmin. Non fanno parte di questo aggiornamento. Tra gli altri obiettivi, non ancora disponibili, ci sono il conteggio delle spinte per chi usa una sedia a rotelle e un supporto più ampio per gli sport in carrozzina e gli allenamenti adattati.",
      en: "We’re working on new integrations for Huawei and Garmin. They’re not part of this update. We’re also working on wheelchair push counts and better support for wheelchair sports and other adaptive workouts. Those features aren’t available yet.",
    } },
    { type: "paragraph", text: {
      it: "Grazie a chi ha provato la 192 e ci ha segnalato cosa non funzionava. Se dopo l’aggiornamento manca ancora una lettura, puoi scrivere a [hello@fitmesh.fit](mailto:hello@fitmesh.fit) con il modello del dispositivo e il tipo di dato. Non occorre inviare i valori delle misurazioni.",
      en: "Thanks to everyone who tried build 192 and told us what wasn’t working. If a reading is still missing after you update, you can email [hello@fitmesh.fit](mailto:hello@fitmesh.fit) with the device model and the type of data. You don’t need to send your actual readings.",
    } },
  ],
};
