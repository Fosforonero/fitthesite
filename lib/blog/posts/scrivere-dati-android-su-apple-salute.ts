import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "scrivere-dati-android-su-apple-salute",
  category: "guides",
  publishedAt: "2026-06-30",
  updatedAt: "2026-06-30",
  ldType: "BlogPosting",
  readMinutes: 7,
  primaryKeyword: {
    it: "scrivere dati su apple salute",
    en: "write to apple health",
  },
  secondaryKeywords: {
    it: [
      "dati android in apple salute",
      "galaxy watch su apple salute",
      "anello colmi apple salute",
      "sincronizzare wearable android iphone",
      "ponte apple health",
    ],
    en: [
      "android data in apple health",
      "galaxy watch to apple health",
      "colmi ring apple health",
      "sync android wearable to iphone",
      "apple health write bridge",
    ],
  },
  metaDescription: {
    it: "Apple Salute non vede il tuo wearable Android. FitMesh scrive sonno, battito a riposo, SpO2, peso, passi, distanza e calorie del tuo Galaxy Watch o anello Colmi dentro Apple Salute, opt-in e senza duplicati.",
    en: "Apple Health does not see your Android wearable. FitMesh writes sleep, resting heart rate, SpO2, weight, steps, distance and calories from your Galaxy Watch or Colmi ring into Apple Health, opt-in and without duplicates.",
  },
  hero: {
    kicker: { it: "Guida", en: "Guide" },
    title: {
      it: "Come portare i dati del tuo wearable Android dentro Apple Salute",
      en: "How to get your Android wearable data into Apple Health",
    },
    subtitle: {
      it: "Apple Salute mostra solo ciò che registrano iPhone e Apple Watch. FitMesh ci scrive dentro anche i dati del tuo Galaxy Watch o anello Colmi, con un ponte opt-in che evita loop e duplicati.",
      en: "Apple Health only shows what your iPhone and Apple Watch record. FitMesh also writes your Galaxy Watch or Colmi ring data into it, through an opt-in bridge that avoids loops and duplicates.",
    },
  },
  tldr: {
    it: [
      "Apple Salute su iPhone mostra solo i dati di iPhone e Apple Watch: quelli del tuo Galaxy Watch o anello Colmi non ci sono.",
      "Quasi tutte le app si limitano a leggere da Apple Salute. FitMesh ci scrive dentro, opt-in, i dati raccolti dai tuoi wearable Android.",
      "Scrive sonno con fasi, battito a riposo, SpO2, peso, passi (gap-fill), distanza e calorie attive.",
      "Anti-loop e anti-duplicato: non riscrive ciò che Apple Salute ha già, e non rilegge ciò che ha scritto.",
      "L'app iOS è live sull'App Store nel mondo; nei 27 paesi UE è in arrivo a giorni.",
    ],
    en: [
      "On iPhone, Apple Health only shows iPhone and Apple Watch data: your Galaxy Watch or Colmi ring data is missing.",
      "Almost every app only reads from Apple Health. FitMesh also writes your Android wearable data into it, opt-in.",
      "It writes sleep with stages, resting heart rate, SpO2, weight, steps (gap-fill), distance and active calories.",
      "Anti-loop and anti-duplicate: it never rewrites what Apple Health already has, and never re-reads what it wrote.",
      "The iOS app is live on the App Store worldwide; in the 27 EU countries it is rolling out in the coming days.",
    ],
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Hai un iPhone e un wearable Android, per esempio un Galaxy Watch o un anello smart Colmi. Apri l'app Salute e i tuoi dati non ci sono: passi, sonno e battito restano chiusi nell'app del produttore, sul lato Android. Apple Salute raccoglie solo ciò che registrano iPhone e Apple Watch. FitMesh risolve esattamente questo.",
        en: "You have an iPhone and an Android wearable, for example a Galaxy Watch or a Colmi smart ring. You open the Health app and your data is not there: steps, sleep and heart rate stay locked in the maker's app, on the Android side. Apple Health only collects what your iPhone and Apple Watch record. FitMesh solves exactly this.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Leggere e scrivere: perché quasi nessuno scrive in Apple Salute",
        en: "Reading and writing: why almost no app writes into Apple Health",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "La maggior parte delle app di salute legge da Apple Salute per mostrarti i dati. Scriverci dentro i dati di un wearable Android è molto più raro, perché va fatto con attenzione: senza controlli rischi di creare duplicati (la stessa attività contata due volte) o un loop (l'app rilegge ciò che ha appena scritto e lo riscrive all'infinito). FitMesh ha entrambe le protezioni di serie.",
        en: "Most health apps read from Apple Health to show you data. Writing Android wearable data into it is much rarer, because it has to be done carefully: without safeguards you risk duplicates (the same activity counted twice) or a loop (the app re-reads what it just wrote and rewrites it forever). FitMesh has both protections built in.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa scrive FitMesh in Apple Salute",
        en: "What FitMesh writes into Apple Health",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "Sonno con fasi: profondo, leggero, REM e veglia, non solo la durata totale.",
          "Battito a riposo (resting heart rate).",
          "SpO2 (ossigenazione del sangue).",
          "Peso.",
          "Passi, in gap-fill: solo le ore in cui Apple Salute non ha già un'altra sorgente.",
          "Distanza camminata e corsa.",
          "Calorie attive.",
        ],
        en: [
          "Sleep with stages: deep, light, REM and awake, not just total duration.",
          "Resting heart rate.",
          "SpO2 (blood oxygen).",
          "Weight.",
          "Steps, as gap-fill: only the hours where Apple Health does not already have another source.",
          "Walking and running distance.",
          "Active calories.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Come evita duplicati e loop",
        en: "How it avoids duplicates and loops",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "Anti-loop: quando FitMesh legge Apple Salute, esclude i campioni scritti da sé stesso, quindi non rilegge mai i propri dati.",
          "Anti-duplicato sui passi: li scrive solo nelle ore vuote (gap-fill orario), così non sommi due volte la stessa attività.",
          "Sonno solo se manca: se Apple Salute ha già il sonno per quella notte, FitMesh non lo tocca.",
          "Valore fuso: scrive lo stesso valore vincente mostrato nella dashboard, scelto per sorgente più affidabile.",
        ],
        en: [
          "Anti-loop: when FitMesh reads Apple Health, it excludes the samples it wrote itself, so it never re-reads its own data.",
          "Anti-duplicate on steps: it writes them only in empty hours (hourly gap-fill), so you never double count the same activity.",
          "Sleep only if missing: if Apple Health already has sleep for that night, FitMesh leaves it alone.",
          "Fused value: it writes the same winning value shown in the dashboard, chosen by most reliable source.",
        ],
      },
    },
    {
      type: "callout",
      variant: "info",
      title: { it: "Tutto opt-in", en: "Fully opt-in" },
      body: {
        it: "Il ponte verso Apple Salute si attiva dalle impostazioni iOS di FitMesh e si può disattivare in qualsiasi momento. Finché non lo attivi tu, FitMesh non scrive nulla in Apple Salute.",
        en: "The bridge to Apple Health is enabled from FitMesh's iOS settings and can be turned off at any time. Until you enable it, FitMesh writes nothing into Apple Health.",
      },
    },
    {
      type: "cta",
      title: { it: "Provalo su iPhone", en: "Try it on iPhone" },
      body: {
        it: "L'app iOS è disponibile ora sull'App Store nella maggior parte dei paesi. Nei 27 paesi UE è in arrivo a giorni.",
        en: "The iOS app is available now on the App Store in most countries. In the 27 EU countries it is rolling out in the coming days.",
      },
      ctaLabel: { it: "Apri su App Store", en: "View on the App Store" },
      ctaHref: {
        it: "https://apps.apple.com/app/fitmesh-sync/id6779751708",
        en: "https://apps.apple.com/app/fitmesh-sync/id6779751708",
      },
    },
  ],
  faq: [
    {
      q: { it: "Il ponte è bidirezionale?", en: "Is the bridge bidirectional?" },
      a: {
        it: "No. FitMesh scrive in Apple Salute i dati dei tuoi wearable Android, in una sola direzione. La lettura di Apple Salute è una funzione separata: serve a mostrare nella dashboard ciò che iPhone e Apple Watch registrano.",
        en: "No. FitMesh writes your Android wearable data into Apple Health, in one direction only. Reading Apple Health is a separate feature, used to show in the dashboard what your iPhone and Apple Watch record.",
      },
    },
    {
      q: { it: "Crea duplicati nei miei totali?", en: "Does it create duplicates in my totals?" },
      a: {
        it: "No. I passi vengono scritti solo nelle ore in cui Apple Salute non ha già un'altra sorgente, e il sonno solo se manca. La stessa attività non viene contata due volte.",
        en: "No. Steps are written only in hours where Apple Health has no other source, and sleep only if it is missing. The same activity is never counted twice.",
      },
    },
    {
      q: { it: "Con quali orologi e anelli funziona?", en: "Which watches and rings does it work with?" },
      a: {
        it: "Con il Galaxy Watch (via Health Connect sul telefono Android), con l'anello Colmi R02 o R03 via Bluetooth, e in generale con qualsiasi wearable Android i cui dati arrivano a FitMesh.",
        en: "With the Galaxy Watch (via Health Connect on the Android phone), with the Colmi R02 or R03 ring over Bluetooth, and in general with any Android wearable whose data reaches FitMesh.",
      },
    },
    {
      q: { it: "Mi serve un Apple Watch?", en: "Do I need an Apple Watch?" },
      a: {
        it: "No. Lo scopo del ponte è proprio portare in Apple Salute i dati di wearable diversi dall'Apple Watch.",
        en: "No. The whole point of the bridge is to bring data from wearables other than the Apple Watch into Apple Health.",
      },
    },
  ],
  related: ["dati-anello-smart-apple-salute", "fitmesh-arriva-su-iphone", "da-android-a-iphone-dati-fitness"],
  brandsMentioned: ["Apple", "Samsung", "Colmi"],
};
