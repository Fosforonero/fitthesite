import type { BlogPost } from "../types";

/**
 * MOFU/BOFU: al momento dell'acquisto di un nuovo wearable. Cambio di
 * marca/modello (NON cambio di sistema operativo, quello è
 * da-android-a-iphone-dati-fitness). Value prop centrale: uno storico
 * unificato nel cloud UE che sopravvive al cambio hardware e unisce marche
 * diverse. it + en; gli altri locali si aggiungono dopo.
 */
export const post: BlogPost = {
  slug: "cambiare-smartwatch-senza-perdere-dati",
  category: "guides",
  publishedAt: "2026-07-02",
  updatedAt: "2026-07-02",
  readMinutes: 8,
  hero: {
    kicker: {
      it: "Guida",
      en: "Guide",
    },
    title: {
      it: "Cambiare smartwatch senza perdere lo storico dei dati",
      en: "How to switch smartwatch without losing your data history",
    },
    subtitle: {
      it: "Compri un orologio nuovo o passi a un anello e temi di lasciare indietro anni di passi, sonno e battito? Il problema è che ogni marca chiude lo storico nella propria app. FitMesh lo tiene fuori dal dispositivo, nel cloud in UE, e unisce marche diverse in un'unica dashboard che sopravvive a ogni cambio.",
      en: "Buying a new watch, or moving to a ring, and worried about leaving years of steps, sleep and heart rate behind? The problem is that every brand locks your history inside its own app. FitMesh keeps it off the device, in the EU cloud, and merges different brands into one dashboard that survives every switch.",
    },
  },
  metaDescription: {
    it: "Cambiare smartwatch senza perdere lo storico: FitMesh tiene i dati nel cloud UE, indipendenti dal dispositivo, e unisce marche diverse in un'unica dashboard.",
    en: "Switch smartwatch without losing your history: FitMesh keeps data in the EU cloud, independent of the device, and merges different brands into one dashboard.",
  },
  primaryKeyword: {
    it: "cambiare smartwatch senza perdere dati",
    en: "switch smartwatch without losing data",
  },
  secondaryKeywords: {
    it: [
      "cambiare orologio fitness senza perdere storico",
      "trasferire dati smartwatch nuovo",
      "storico dati fitness nel cloud",
      "unire dati smartwatch marche diverse",
      "cambiare marca smartwatch dati",
      "passare da orologio ad anello dati",
      "dashboard unica wearable",
    ],
    en: [
      "change fitness watch keep history",
      "transfer smartwatch data to new device",
      "unified fitness history cloud",
      "merge data from different smartwatch brands",
      "keep health history switching wearable",
      "switch from watch to ring data",
      "single wearable dashboard",
    ],
  },
  tldr: {
    it: [
      "Cambiare marca di wearable di solito spezza lo storico: ogni app del produttore riparte da un grafico vuoto.",
      "FitMesh tiene lo storico sul tuo account nel cloud in UE, indipendente dal dispositivo.",
      "Unisce marche diverse in una dashboard deduplicata: via Health Connect su Android, Apple Salute su iPhone (in arrivo), e l'anello Colmi via Bluetooth.",
      "Collega FitMesh prima del cambio per portare dentro la base storica; tieni i due dispositivi in parallelo qualche giorno per una transizione senza buchi.",
      "Cambi orologio o anello quante volte vuoi: i dati restano tuoi.",
    ],
    en: [
      "Changing wearable brand usually breaks your history: every manufacturer app restarts from an empty chart.",
      "FitMesh keeps your history on your account in the EU cloud, independent of the device.",
      "It merges different brands into one deduplicated dashboard: via Health Connect on Android, Apple Health on iPhone (coming), and the Colmi ring over Bluetooth.",
      "Connect FitMesh before the switch to pull in your recent baseline; run both devices in parallel for a few days for a gap-free transition.",
      "Change watch or ring as many times as you like: the data stays yours.",
    ],
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Hai appena ordinato un orologio nuovo, o stai passando dall'orologio a un anello. La domanda che spesso frena l'acquisto è sempre la stessa: e tutto lo storico che ho accumulato in questi anni? Passi, sonno, battito, allenamenti, mesi o anni di dati che vivono dentro l'app del vecchio dispositivo. Cambiare marca di solito significa ricominciare da un grafico vuoto. Attenzione a non confondere i due casi: qui non parliamo del passaggio da Android a iPhone (quello è un cambio di sistema operativo, lo trattiamo in [Da Android a iPhone: come non perdere i dati fitness](/blog/da-android-a-iphone-dati-fitness)). Qui parliamo del cambio di marca o modello del wearable: resti sullo stesso telefono, ma il tuo orologio Garmin diventa un Galaxy Watch, o il tuo Fitbit diventa un anello Colmi. Vediamo perché lo storico si spezza e come tenerlo unito.",
        en: "You just ordered a new watch, or you are moving from a watch to a ring. The question that often stalls the purchase is always the same: what about all the history I have built up over the years? Steps, sleep, heart rate, workouts, months or years of data living inside the old device's app. Changing brand usually means starting over from an empty chart. Be careful not to mix up two different cases: this is not about going from Android to iPhone (that is an operating-system change, covered in [From Android to iPhone: how not to lose your fitness data](/blog/da-android-a-iphone-dati-fitness)). This is about changing the brand or model of the wearable itself: you stay on the same phone, but your Garmin watch becomes a Galaxy Watch, or your Fitbit becomes a Colmi ring. Let's look at why the history breaks and how to keep it whole.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Perché cambiando marca lo storico si spezza",
        en: "Why changing brand breaks your history",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Ogni produttore tiene i tuoi dati dentro la propria app e i propri server. Garmin nel suo ecosistema, Fitbit nel suo, Samsung nel suo, Xiaomi e Amazfit nelle rispettive app companion. Sono silos: progettati per funzionare bene finché resti nella stessa marca, non per farti uscire con tutto lo storico in mano. Quando compri un dispositivo di un'altra marca, la nuova app parte da zero. Il vecchio storico non si trasferisce: resta congelato nell'app precedente, quella che pian piano smetterai di aprire. Nessuna delle due app ti mostra la linea continua della tua storia, prima e dopo il cambio.",
        en: "Every manufacturer keeps your data inside its own app and its own servers. Garmin in its ecosystem, Fitbit in its own, Samsung in its own, Xiaomi and Amazfit in their respective companion apps. They are silos: designed to work well as long as you stay within the same brand, not to let you walk out with your whole history in hand. When you buy a device from another brand, the new app starts from scratch. The old history does not transfer: it stays frozen in the previous app, the one you will slowly stop opening. Neither app shows you the continuous line of your story, before and after the switch.",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "La cronologia dei passi e delle calorie si spezza in due grafici separati, uno per app.",
          "Il sonno con le fasi (leggero, profondo, REM) riparte da zero nella nuova app.",
          "Battito a riposo e andamento dell'HRV perdono la base di confronto con i mesi precedenti.",
          "Gli allenamenti registrati con il vecchio dispositivo restano nell'app vecchia, non nella nuova.",
          "Se in futuro cambi di nuovo marca, il problema si ripete e i pezzi da consultare diventano tre.",
        ],
        en: [
          "Your steps and calories history splits into two separate charts, one per app.",
          "Sleep with its stages (light, deep, REM) restarts from zero in the new app.",
          "Resting heart rate and HRV trends lose their point of comparison with the previous months.",
          "Workouts recorded with the old device stay in the old app, not the new one.",
          "If you switch brands again later, the problem repeats and you now have three places to check.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "La continuità vive nel cloud, non nel dispositivo",
        en: "Continuity lives in the cloud, not in the device",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "FitMesh ribalta la logica: invece di legare lo storico a un dispositivo, lo tiene sul tuo account, nel cloud in UE. L'orologio o l'anello sono soltanto la fonte del dato del momento; se domani cambi hardware, la fonte cambia ma lo storico resta lo stesso, sullo stesso account. FitMesh Sync legge i dati salute dei tuoi wearable e li mostra in un pannello web unificato, deduplicati: lo stesso passo non viene contato due volte, anche se per qualche giorno tieni due dispositivi in parallelo. Puoi consultare tutto da qualsiasi browser, come spieghiamo in [Vedere i dati del wearable dal browser del PC](/blog/vedere-dati-wearable-browser-pc), e se indossi più dispositivi insieme la dashboard li unisce senza [contare i dati doppi](/blog/piu-smartwatch-insieme-dati-doppi).",
        en: "FitMesh flips the logic: instead of tying your history to a device, it keeps it on your account, in the EU cloud. The watch or ring is only the source of the moment's data; if you change hardware tomorrow, the source changes but the history stays the same, on the same account. FitMesh Sync reads the health data from your wearables and shows it in a unified web panel, deduplicated: the same step is not counted twice, even if you run two devices in parallel for a few days. You can view everything from any browser, as we explain in [See your wearable data from a PC browser](/blog/vedere-dati-wearable-browser-pc), and if you wear several devices at once the dashboard merges them without [counting the data twice](/blog/piu-smartwatch-insieme-dati-doppi).",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: {
        it: "Come FitMesh legge i tuoi dispositivi",
        en: "How FitMesh reads your devices",
      },
      body: {
        it: "Su Android, FitMesh Sync è disponibile su Google Play e legge i dati via Health Connect, l'hub salute del telefono a cui la maggior parte delle app dei produttori scrive. Legge anche l'anello Colmi (serie R: R02, R06, R08, R09, R10 e simili) direttamente via Bluetooth, senza bisogno dell'app companion. Su iPhone la versione è in arrivo (in revisione App Store) e scriverà su Apple Salute. Se una marca alimenta Health Connect o Apple Salute, il suo storico entra nel tuo account FitMesh insieme a quello delle altre. Approfondiamo il meccanismo in [Come funziona Health Connect](/blog/come-funziona-health-connect).",
        en: "On Android, FitMesh Sync is available on Google Play and reads data via Health Connect, the phone's health hub that most manufacturer apps write to. It also reads the Colmi ring (R series: R02, R06, R08, R09, R10 and similar) directly over Bluetooth, with no companion app needed. On iPhone the version is coming (in App Store review) and will write to Apple Health. If a brand feeds Health Connect or Apple Health, its history flows into your FitMesh account alongside the others. We go deeper in [How Health Connect works](/blog/come-funziona-health-connect).",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Checklist: prima, durante e dopo il cambio",
        en: "Checklist: before, during and after the switch",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "**Prima:** installa FitMesh Sync su Android mentre usi ancora il vecchio dispositivo e collegalo, così lo storico recente entra subito nel tuo account.",
          "**Prima:** verifica che il vecchio orologio scriva su Health Connect e lascia sincronizzare qualche giorno, per portare dentro la base storica.",
          "**Durante:** ricevuto il nuovo wearable, collegalo alla sua app companion (o, per l'anello Colmi, direttamente a FitMesh via Bluetooth) e concedi i permessi a Health Connect.",
          "**Durante:** tieni entrambi i dispositivi attivi per qualche giorno se vuoi una transizione morbida; la deduplicazione evita i doppi conteggi.",
          "**Dopo:** apri la dashboard web e controlla che la linea di passi, sonno e battito prosegua senza buchi attraverso la data del cambio.",
          "**Dopo:** quando sei sicuro, puoi smettere di indossare il vecchio dispositivo; lo storico resta comunque nel tuo account, indipendente dall'hardware.",
        ],
        en: [
          "**Before:** install FitMesh Sync on Android while you are still using the old device and connect it, so your recent history enters your account right away.",
          "**Before:** check that the old watch writes to Health Connect and let it sync for a few days, to pull in the historical baseline.",
          "**During:** once the new wearable arrives, connect it to its companion app (or, for the Colmi ring, directly to FitMesh over Bluetooth) and grant the Health Connect permissions.",
          "**During:** keep both devices active for a few days if you want a soft transition; deduplication prevents double counting.",
          "**After:** open the web dashboard and check that the line of steps, sleep and heart rate continues with no gaps across the switch date.",
          "**After:** once you are confident, you can stop wearing the old device; the history stays in your account anyway, independent of the hardware.",
        ],
      },
    },
    {
      type: "comparison",
      aTitle: {
        it: "Con la sola app del produttore",
        en: "With the manufacturer app alone",
      },
      aItems: {
        it: [
          "Lo storico è legato alla marca: cambi dispositivo, riparti da un grafico vuoto.",
          "Ogni cambio aggiunge un'app da tenere solo per consultare il passato.",
          "Confronti prima/dopo impossibili: i dati vivono in silos separati.",
          "Se chiudi il vecchio account, rischi di perdere lo storico.",
        ],
        en: [
          "History is tied to the brand: change device, start from an empty chart.",
          "Every switch adds one more app kept around just to look at the past.",
          "Before/after comparisons are impossible: the data lives in separate silos.",
          "If you close the old account, you risk losing the history.",
        ],
      },
      bTitle: {
        it: "Con FitMesh",
        en: "With FitMesh",
      },
      bItems: {
        it: [
          "Lo storico è sul tuo account nel cloud UE, non sul dispositivo.",
          "Marche diverse confluiscono in un'unica dashboard, deduplicate.",
          "La linea temporale prosegue attraverso il cambio hardware.",
          "Cambi orologio o anello quante volte vuoi, i dati restano tuoi.",
        ],
        en: [
          "History lives on your account in the EU cloud, not on the device.",
          "Different brands flow into one dashboard, deduplicated.",
          "The timeline continues across the hardware change.",
          "Change watch or ring as often as you like, the data stays yours.",
        ],
      },
    },
    {
      type: "table",
      caption: {
        it: "Cosa succede allo storico in alcuni scenari di cambio",
        en: "What happens to your history in a few switch scenarios",
      },
      headers: {
        it: ["Cambio", "Con la sola app del produttore", "Con FitMesh"],
        en: ["Switch", "With the manufacturer app alone", "With FitMesh"],
      },
      rows: [
        {
          it: ["Da Garmin a Galaxy Watch", "Due storici separati", "Storico unico e continuo"],
          en: ["Garmin to Galaxy Watch", "Two separate histories", "One continuous history"],
        },
        {
          it: ["Da Fitbit ad anello Colmi", "Riparti da zero sul sonno", "Sonno e passi proseguono"],
          en: ["Fitbit to Colmi ring", "Sleep restarts from zero", "Sleep and steps continue"],
        },
        {
          it: ["Da Xiaomi o Amazfit a Pixel Watch", "Grafici spezzati", "Un'unica linea temporale"],
          en: ["Xiaomi or Amazfit to Pixel Watch", "Split charts", "A single timeline"],
        },
        {
          it: ["Da orologio ad anello (o viceversa)", "App diverse, nessun confronto", "Fusione giorno/notte in un pannello"],
          en: ["Watch to ring (or the other way)", "Different apps, no comparison", "Day/night fusion in one panel"],
        },
        {
          it: ["Secondo cambio in un anno", "Tre app, tre storici", "Sempre lo stesso account"],
          en: ["Second switch within a year", "Three apps, three histories", "Always the same account"],
        },
      ],
    },
    {
      type: "cta",
      title: {
        it: "Cambi wearable? Porta lo storico con te",
        en: "Switching wearable? Take your history with you",
      },
      body: {
        it: "FitMesh Sync è disponibile ora su Android, con dashboard web inclusa. I primi 1000 iscritti founder ottengono il Pro a vita gratis; dopo, c'è una prova completa di 14 giorni e poi un unico abbonamento Pro. La versione iPhone è in arrivo: iscriviti alla beta per averla al lancio e iniziare a costruire uno storico che sopravvive al prossimo cambio di orologio.",
        en: "FitMesh Sync is available now on Android, with the web dashboard included. The first 1,000 founder sign-ups get lifetime Pro free; after that there is a full 14-day trial and then a single Pro subscription. The iPhone version is coming: join the beta to get it at launch and start building a history that survives your next change of watch.",
      },
      ctaLabel: {
        it: "Unisciti alla beta →",
        en: "Join the beta →",
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
        it: "Cambiando marca di smartwatch perdo lo storico dei dati?",
        en: "If I change smartwatch brand, do I lose my data history?",
      },
      a: {
        it: "Con le sole app dei produttori, di fatto sì: ogni app parte da zero e il passato resta nella vecchia. Con FitMesh no: lo storico è legato al tuo account nel cloud in UE, non al dispositivo, quindi resta lì anche quando cambi orologio o anello.",
        en: "With the manufacturer apps alone, effectively yes: each app starts from zero and the past stays in the old one. With FitMesh, no: your history is tied to your account in the EU cloud, not to the device, so it stays there even when you change watch or ring.",
      },
    },
    {
      q: {
        it: "Funziona tra marche diverse?",
        en: "Does it work across different brands?",
      },
      a: {
        it: "Sì. Su Android FitMesh legge i dati via Health Connect, a cui scrive la maggior parte delle app dei produttori, e legge l'anello Colmi direttamente via Bluetooth. Marche diverse confluiscono così nella stessa dashboard, deduplicate. Su iPhone la versione in arrivo scriverà su Apple Salute.",
        en: "Yes. On Android FitMesh reads data via Health Connect, which most manufacturer apps write to, and reads the Colmi ring directly over Bluetooth. Different brands thus flow into the same dashboard, deduplicated. On iPhone the upcoming version will write to Apple Health.",
      },
    },
    {
      q: {
        it: "Cosa succede allo storico del vecchio dispositivo?",
        en: "What happens to the old device's history?",
      },
      a: {
        it: "Lo storico già entrato nel tuo account FitMesh resta lì, che tu smetta di usare il vecchio dispositivo o disinstalli la sua app. Per questo conviene collegare FitMesh prima del cambio, così porti dentro anche la base storica recente.",
        en: "The history already pulled into your FitMesh account stays there, whether you stop using the old device or uninstall its app. That is why it pays to connect FitMesh before the switch, so you also bring in the recent baseline.",
      },
    },
    {
      q: {
        it: "Devo tenere due dispositivi insieme durante la transizione?",
        en: "Do I need to keep two devices together during the transition?",
      },
      a: {
        it: "Non è obbligatorio, ma può aiutare. Se tieni vecchio e nuovo attivi per qualche giorno, la deduplicazione evita di contare due volte gli stessi passi e la transizione risulta senza buchi. Quando sei pronto, smetti di indossare il vecchio.",
        en: "It is not required, but it can help. If you keep the old and the new active for a few days, deduplication avoids counting the same steps twice and the transition comes out gap-free. When you are ready, stop wearing the old one.",
      },
    },
    {
      q: {
        it: "Serve un abbonamento?",
        en: "Do I need a subscription?",
      },
      a: {
        it: "L'app Android è disponibile ora con dashboard web inclusa. I primi 1000 iscritti founder ricevono il Pro a vita gratis. Dopo, c'è una prova completa di 14 giorni e poi un unico abbonamento Pro; non esiste un piano gratuito permanente. Il prezzo aggiornato è mostrato nell'app.",
        en: "The Android app is available now with the web dashboard included. The first 1,000 founder sign-ups get lifetime Pro free. After that there is a full 14-day trial and then a single Pro subscription; there is no permanent free plan. The current price is shown in the app.",
      },
    },
    {
      q: {
        it: "I dati dell'anello o dell'orologio sono a livello medico?",
        en: "Is the ring or watch data medical grade?",
      },
      a: {
        it: "No. Passi, battito, SpO2, sonno e stress sono misure di consumo per il benessere, non strumenti diagnostici. Servono a vedere tendenze nel tempo, non a interpretare valori clinici.",
        en: "No. Steps, heart rate, SpO2, sleep and stress are consumer wellness measurements, not diagnostic tools. They are there to show trends over time, not to interpret clinical values.",
      },
    },
  ],
  related: [
    "scegliere-smartwatch-dati-2026",
    "piu-smartwatch-insieme-dati-doppi",
    "da-android-a-iphone-dati-fitness",
    "guida-sync-wearable-2026",
    "vedere-dati-wearable-browser-pc",
  ],
  brandsMentioned: ["Garmin", "Fitbit", "Samsung", "Xiaomi", "Amazfit", "Colmi", "Apple", "Google"],
  ldType: "BlogPosting",
};
