import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "fitmesh-arriva-su-iphone",
  category: "ecosystem",
  publishedAt: "2026-06-12",
  updatedAt: "2026-06-12",
  readMinutes: 6,
  tldr: {
    it: [
      "FitMesh Sync è ora in beta TestFlight su iPhone: login Google o Apple, lettura Apple Health/HealthKit, sync cloud, anello Colmi via Bluetooth. Uscita App Store imminente.",
      "Un solo account funziona su Android e iPhone insieme: la dashboard è identica su entrambi i telefoni, i dati vengono dallo stesso cloud EU.",
      "Feature di punta: il ponte di scrittura Apple Salute (opt-in) — i dati del tuo smartwatch Android o anello smart arrivano via cloud FitMesh e vengono scritti in Apple Salute, senza duplicati.",
      "Chi ha due telefoni (es. Android + iPhone) vede il sonno dell'anello e i passi del watch direttamente dentro l'app Apple Salute/Fitness.",
      "Dati in cloud EU, GDPR, zero vendita a terzi. Il ponte è opt-in e idempotente: si scrive solo dove Apple Salute non ha già dati di altre sorgenti.",
    ],
    en: [
      "FitMesh Sync is now in TestFlight beta on iPhone: Google or Apple login, Apple Health/HealthKit reading, cloud sync, Colmi ring via Bluetooth. App Store launch imminent.",
      "One account works across Android and iPhone: the dashboard is identical on both phones, data comes from the same EU cloud.",
      "Flagship feature: the Apple Health write bridge (opt-in) — data from your Android smartwatch or smart ring arrives via FitMesh cloud and gets written into Apple Health, with no duplicates.",
      "Users with two phones (e.g. Android + iPhone) see ring sleep and watch steps directly inside the Apple Health/Fitness app.",
      "EU cloud, GDPR, zero third-party data sales. The bridge is opt-in and idempotent: it only writes where Apple Health has no data from other sources.",
    ],
  },
  primaryKeyword: {
    it: "fitmesh sync iphone",
    en: "fitmesh sync iphone",
  },
  secondaryKeywords: {
    it: [
      "fitmesh ios beta",
      "app salute iphone smartwatch android",
      "sincronizzare smartwatch android apple salute",
      "ponte apple salute wearable android",
      "dashboard salute iphone",
    ],
    en: [
      "fitmesh ios beta",
      "apple health android smartwatch sync",
      "write android data to apple health",
      "apple health bridge wearable",
      "health dashboard iphone",
    ],
  },
  metaDescription: {
    it: "FitMesh Sync arriva su iPhone: beta TestFlight attiva, App Store imminente. Un account, Android + iPhone insieme. Feature esclusiva: ponte di scrittura Apple Salute per i dati del tuo wearable Android.",
    en: "FitMesh Sync arrives on iPhone: TestFlight beta active, App Store launch imminent. One account, Android + iPhone together. Flagship feature: Apple Health write bridge for your Android wearable data.",
  },
  hero: {
    kicker: { it: "Annuncio", en: "Announcement" },
    title: {
      it: "FitMesh Sync arriva su iPhone",
      en: "FitMesh Sync arrives on iPhone",
    },
    subtitle: {
      it: "Dopo mesi di sviluppo, l'app iOS è in beta TestFlight e in submission su App Store. Un account, Android e iPhone insieme. E una feature nuova: i dati del tuo wearable Android scritti direttamente in Apple Salute.",
      en: "After months of development, the iOS app is in TestFlight beta and in App Store submission. One account, Android and iPhone together. And a new feature: your Android wearable data written directly into Apple Health.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Oggi, 12 giugno 2026, FitMesh Sync funziona su iPhone. L'app è in beta TestFlight, in submission su App Store, e già testata sul campo con login Google e Apple, lettura completa di Apple Health, sync cloud e connessione BLE all'anello Colmi. Non è una demo: è l'app reale, con tutte le funzionalità che già conosci dalla versione Android.",
        en: "Today, June 12 2026, FitMesh Sync works on iPhone. The app is in TestFlight beta, in App Store submission, and already field-tested with Google and Apple login, full Apple Health reading, cloud sync and BLE connection to the Colmi ring. This isn't a demo: it's the real app, with all the features you already know from the Android version.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa funziona oggi in beta",
        en: "What works today in beta",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Login Google e Sign in with Apple**: stesso account che usi su Android, zero doppioni.",
          "**Lettura Apple Health / HealthKit**: passi, frequenza cardiaca, sonno con fasi, SpO₂, calorie, distanza — tutto quello che il tuo iPhone o Apple Watch scrive in Apple Salute è visibile in FitMesh.",
          "**Sync cloud EU**: i dati vengono sincronizzati sullo stesso backend che serve l'app Android, in datacenter EU, GDPR.",
          "**Anello Colmi via Bluetooth**: se hai un anello smart Colmi R02/R03, l'app iOS lo legge via BLE diretto come fa quella Android.",
          "**Dashboard unificata**: la stessa interfaccia che conosci su Android, con trend giornalieri, settimana in review, confronto multi-sorgente.",
          "**Ponte di scrittura Apple Salute** (opt-in): i dati degli altri device collegati al tuo account FitMesh vengono scritti in Apple Salute — dettaglio completo nella sezione dedicata.",
        ],
        en: [
          "**Google login and Sign in with Apple**: same account you use on Android, zero duplicates.",
          "**Apple Health / HealthKit reading**: steps, heart rate, sleep with stages, SpO₂, calories, distance — everything your iPhone or Apple Watch writes to Apple Health is visible in FitMesh.",
          "**EU cloud sync**: data is synced to the same backend serving the Android app, in EU datacenters, GDPR.",
          "**Colmi ring via Bluetooth**: if you have a Colmi R02/R03 smart ring, the iOS app reads it via direct BLE like the Android version does.",
          "**Unified dashboard**: the same interface you know from Android, with daily trends, week-in-review, multi-source comparison.",
          "**Apple Health write bridge** (opt-in): data from other devices connected to your FitMesh account gets written into Apple Health — full details in the dedicated section.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Un account, Android e iPhone insieme",
        en: "One account, Android and iPhone together",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "La cosa che più mi piaceva risolvere era questa: hai due telefoni, una dashboard. Accedi con lo stesso account su Android e su iPhone: i dati di tutti i device collegati (Galaxy Watch, anello Colmi, Apple Watch, qualsiasi wearable che scrivi su Health Connect o Apple Health) confluiscono in un'unica dashboard, accessibile da entrambi i telefoni e da qualsiasi browser web.",
        en: "The thing I most wanted to solve was this: you have two phones, one dashboard. Sign in with the same account on Android and iPhone: data from all connected devices (Galaxy Watch, Colmi ring, Apple Watch, any wearable writing to Health Connect or Apple Health) feeds into one unified dashboard, accessible from both phones and any web browser.",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: { it: "Come funziona il cross-device", en: "How cross-device works" },
      body: {
        it: "Ogni device scrive i propri dati sul cloud FitMesh (EU). La dashboard li legge tutti, applica la logica di priorità sorgente (per evitare doppi conteggi dove c'è sovrapposizione) e mostra un unico flusso coerente. Non importa da quale telefono apri l'app: vedi sempre lo stesso dataset.",
        en: "Each device writes its data to the FitMesh EU cloud. The dashboard reads all of them, applies source priority logic (to avoid double-counting where there's overlap) and shows a single coherent stream. It doesn't matter which phone you open the app on: you always see the same dataset.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Il ponte di scrittura Apple Salute: i dati del tuo wearable Android dentro Apple Health",
        en: "The Apple Health write bridge: your Android wearable data inside Apple Health",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Questa è la feature che ho trovato più utile in test. Se hai un Galaxy Watch o un anello smart accoppiato con il telefono Android, e apri l'app Salute sull'iPhone, quei dati non ci sono. Il ponte di scrittura Apple Salute risolve questo: i dati raccolti dagli altri device del tuo account FitMesh (smartwatch Android, anello Colmi, qualsiasi sorgente già collegata) arrivano via cloud e vengono scritti in Apple Salute, opt-in.",
        en: "This is the feature I found most useful in testing. If you have a Galaxy Watch or smart ring paired with your Android phone, and open the Health app on iPhone, those data aren't there. The Apple Health write bridge solves this: data collected from other devices on your FitMesh account (Android smartwatch, Colmi ring, any already-connected source) arrives via cloud and gets written into Apple Health, opt-in.",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Sonno con fasi complete**: profondo, leggero, REM — non solo la durata totale, ma le fasi dettagliate del tuo anello o watch Android, visibili in Apple Salute come se fossero stati registrati dall'iPhone.",
          "**Passi e attività**: i passi del Galaxy Watch o del wearable Android finiscono nei tuoi totali Apple Fitness senza che tu debba fare nulla.",
          "**Zero duplicati**: il bridge usa una logica idempotente — scrive solo nei slot temporali dove Apple Salute non ha già dati di un'altra sorgente. Se Apple Watch ha già registrato la stessa ora, il ponte non sovrascrive.",
          "**Completamente opt-in**: si attiva dalle impostazioni iOS di FitMesh, disattivabile in qualsiasi momento.",
        ],
        en: [
          "**Sleep with full stages**: deep, light, REM — not just total duration, but the detailed stages from your Android ring or watch, visible in Apple Health as if recorded by iPhone.",
          "**Steps and activity**: steps from Galaxy Watch or Android wearable land in your Apple Fitness totals without you having to do anything.",
          "**Zero duplicates**: the bridge uses idempotent logic — it only writes to time slots where Apple Health has no data from another source. If Apple Watch already recorded the same hour, the bridge doesn't overwrite.",
          "**Fully opt-in**: activated from FitMesh iOS settings, can be turned off at any time.",
        ],
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: {
        it: "Caso d'uso tipico: Galaxy Watch + iPhone",
        en: "Typical use case: Galaxy Watch + iPhone",
      },
      body: {
        it: "Usi un Galaxy Watch accoppiato col telefono Android, ma il telefono principale è l'iPhone. Prima: i dati del Watch erano visibili solo in Samsung Health su Android. Ora: FitMesh li legge su Android, li sincronizza sul cloud EU, e l'app iOS li scrive in Apple Salute — compresi gli stage del sonno. Il tuo iPhone Fitness vede tutto.",
        en: "You use a Galaxy Watch paired to Android, but your main phone is iPhone. Before: Watch data was only visible in Samsung Health on Android. Now: FitMesh reads them on Android, syncs to EU cloud, and the iOS app writes them into Apple Health — including sleep stages. Your iPhone Fitness sees everything.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Privacy e sicurezza",
        en: "Privacy and security",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Tutti i dati transitano e vengono archiviati su cloud in datacenter EU, conformi GDPR. FitMesh non vende dati a terzi e non li usa per addestrare modelli. Il ponte di scrittura Apple Salute è opt-in: se non lo attivi, l'app iOS legge da Apple Health ma non scrive nulla. Puoi revocare i permessi HealthKit dall'app Impostazioni iPhone in qualsiasi momento.",
        en: "All data transits and is stored in EU datacenter cloud, GDPR compliant. FitMesh doesn't sell data to third parties and doesn't use it to train models. The Apple Health write bridge is opt-in: if you don't activate it, the iOS app reads from Apple Health but writes nothing. You can revoke HealthKit permissions from iPhone Settings at any time.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Come entrare in beta",
        en: "How to join the beta",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Iscriviti alla beta dalla pagina /beta di questo sito — ti mandiamo l'invito TestFlight.",
          "Installa l'app tramite il link TestFlight ricevuto per email.",
          "Accedi con lo stesso account Google o Apple che usi (o che useresti) su Android.",
          "Attiva il ponte Apple Salute dalle Impostazioni se vuoi scrivere i dati dei device Android.",
        ],
        en: [
          "Sign up for the beta from the /beta page on this site — we'll send you a TestFlight invite.",
          "Install the app via the TestFlight link received by email.",
          "Sign in with the same Google or Apple account you use (or would use) on Android.",
          "Enable the Apple Health bridge from Settings if you want to write data from Android devices.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "In sintesi", en: "In summary" },
    },
    {
      type: "list",
      items: {
        it: [
          "FitMesh Sync è in beta TestFlight su iPhone, con uscita App Store imminente.",
          "Un account, due telefoni: la stessa dashboard su Android e iPhone, dati dallo stesso cloud EU.",
          "Il ponte di scrittura Apple Salute (opt-in, idempotente) porta i dati del tuo wearable Android dentro l'app Salute di iPhone — sonno con fasi, passi, attività, senza duplicati.",
          "Privacy EU/GDPR: nessuna vendita di dati, bridge opt-in, revocabile in qualsiasi momento.",
        ],
        en: [
          "FitMesh Sync is in TestFlight beta on iPhone, with App Store launch imminent.",
          "One account, two phones: the same dashboard on Android and iPhone, data from the same EU cloud.",
          "The Apple Health write bridge (opt-in, idempotent) brings your Android wearable data into the iPhone Health app — sleep with stages, steps, activity, no duplicates.",
          "EU/GDPR privacy: no data sales, opt-in bridge, revocable at any time.",
        ],
      },
    },
    {
      type: "cta",
      title: {
        it: "Entra in beta iOS — posti limitati",
        en: "Join the iOS beta — limited spots",
      },
      body: {
        it: "La beta TestFlight è aperta. Iscriviti dalla pagina beta e ricevi il link di installazione entro 24 ore. L'uscita su App Store è imminente.",
        en: "The TestFlight beta is open. Sign up from the beta page and receive your installation link within 24 hours. App Store launch is imminent.",
      },
      ctaLabel: {
        it: "Iscriviti alla beta iOS →",
        en: "Join the iOS beta →",
      },
      ctaHref: {
        it: "/it/beta",
        en: "/en/beta",
      },
    },
  ],
  faq: [
    {
      q: {
        it: "FitMesh iOS è già sull'App Store?",
        en: "Is FitMesh iOS already on the App Store?",
      },
      a: {
        it: "Non ancora. L'app è in beta TestFlight e in submission su App Store. L'uscita è imminente. Nel frattempo puoi iscriverti alla beta dalla pagina /beta e ricevere l'accesso TestFlight.",
        en: "Not yet. The app is in TestFlight beta and in App Store submission. Launch is imminent. In the meantime you can sign up for the beta from the /beta page and receive TestFlight access.",
      },
    },
    {
      q: {
        it: "Devo creare un nuovo account per iOS?",
        en: "Do I need to create a new account for iOS?",
      },
      a: {
        it: "No. Usa lo stesso account Google o Apple che hai su Android (o che crei per la prima volta). Un account FitMesh funziona su tutti i device: Android, iPhone e dashboard web.",
        en: "No. Use the same Google or Apple account you have on Android (or that you're creating for the first time). One FitMesh account works on all devices: Android, iPhone and web dashboard.",
      },
    },
    {
      q: {
        it: "Il ponte Apple Salute funziona in entrambe le direzioni?",
        en: "Does the Apple Health bridge work in both directions?",
      },
      a: {
        it: "Il ponte di scrittura porta dati dai device Android verso Apple Salute. La lettura da Apple Salute (per vedere i dati di Apple Watch o dei wearable iOS) funziona sempre, indipendentemente dal bridge. In sintesi: FitMesh legge da Apple Health (sempre), e può scrivere su Apple Health (opt-in) i dati raccolti dagli altri device del tuo account.",
        en: "The write bridge brings data from Android devices to Apple Health. Reading from Apple Health (to see Apple Watch or iOS wearable data) always works, regardless of the bridge. In short: FitMesh reads from Apple Health (always), and can write to Apple Health (opt-in) data collected from other devices on your account.",
      },
    },
    {
      q: {
        it: "Se ho sia Apple Watch che Galaxy Watch, ci sono duplicati?",
        en: "If I have both Apple Watch and Galaxy Watch, will there be duplicates?",
      },
      a: {
        it: "No. Il ponte usa logica idempotente: verifica prima se Apple Health ha già un dato per quella fascia oraria da un'altra sorgente. Se Apple Watch ha già registrato sonno dalle 23:00 alle 07:00, il bridge non scrive nulla per quelle ore. Si scrive solo dove non c'è già copertura.",
        en: "No. The bridge uses idempotent logic: it checks first whether Apple Health already has data for that time slot from another source. If Apple Watch has already recorded sleep from 11pm to 7am, the bridge writes nothing for those hours. It only writes where there's no existing coverage.",
      },
    },
    {
      q: {
        it: "Quali device Android funzionano con il ponte Apple Salute?",
        en: "Which Android devices work with the Apple Health bridge?",
      },
      a: {
        it: "Tutti i device già supportati da FitMesh su Android: Galaxy Watch (via Samsung Health e Health Connect), anelli Colmi R02/R03 via BLE, e qualsiasi wearable che scrive su Health Connect. I dati di questi device vengono sincronizzati sul cloud FitMesh e possono essere scritti su Apple Health dall'app iOS.",
        en: "All devices already supported by FitMesh on Android: Galaxy Watch (via Samsung Health and Health Connect), Colmi R02/R03 rings via BLE, and any wearable writing to Health Connect. Data from these devices is synced to the FitMesh cloud and can be written to Apple Health by the iOS app.",
      },
    },
  ],
  related: [
    "how-to-export-apple-health-data",
    "colmi-ring-fitmesh",
    "come-funziona-health-connect",
  ],
  brandsMentioned: ["Apple", "Google", "Samsung"],
  ldType: "BlogPosting",
};
