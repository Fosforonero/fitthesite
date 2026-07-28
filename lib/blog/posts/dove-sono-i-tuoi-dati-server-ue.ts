import type { BlogPost } from "../types";

/**
 * BOFU fiducia: risponde all'obiezione numero uno prima di collegare un
 * account salute a un'app terza, ossia "dove finiscono i miei dati". Onesto
 * sul modello (server UE, no ads, no vendita dati) e collega il piccolo
 * prezzo del Pro al perché NON serve monetizzare i dati per sostenersi.
 * it/en; gli altri locali si aggiungono dopo.
 */
export const post: BlogPost = {
  slug: "dove-sono-i-tuoi-dati-server-ue",
  category: "privacy",
  publishedAt: "2026-07-04",
  updatedAt: "2026-07-04",
  readMinutes: 7,
  hero: {
    kicker: { it: "Privacy", en: "Privacy" },
    title: {
      it: "Dove sono i tuoi dati e perché un server in UE conta",
      en: "Where your data actually lives, and why an EU server matters",
    },
    subtitle: {
      it: "Prima di collegare il tuo anello o smartwatch a un'app, è giusto chiedersi dove finiscono i tuoi dati salute. Risposta diretta: sul tuo account, su server nell'Unione Europea, mai venduti e mai usati per pubblicità. Ecco cosa significa in pratica e perché è proprio questo modello che rende FitMesh sostenibile con un prezzo così piccolo.",
      en: "Before you connect your ring or smartwatch to an app, it's fair to ask where your health data ends up. Direct answer: on your account, on servers in the European Union, never sold and never used for advertising. Here's what that means in practice, and why this exact model is what keeps FitMesh sustainable at such a small price.",
    },
  },
  metaDescription: {
    it: "Dove sono conservati i dati del tuo smartwatch o anello con FitMesh? Server in UE, GDPR, nessuna vendita dei dati, nessuna pubblicità. Ecco come funziona davvero.",
    en: "Where is your smartwatch or ring data stored with FitMesh? EU servers, GDPR, no data sold, no ads. Here's exactly how it works.",
  },
  primaryKeyword: {
    it: "dove sono conservati i dati dello smartwatch",
    en: "where is my wearable data stored",
  },
  secondaryKeywords: {
    it: [
      "privacy dati fitness",
      "server ue dati salute",
      "gdpr smartwatch",
      "chi vede i miei dati fitness",
      "fitmesh vende i dati",
      "privacy anello smart",
      "dati wearable cloud europa",
    ],
    en: [
      "fitness data privacy",
      "eu server health data",
      "gdpr smartwatch",
      "who can see my fitness data",
      "does fitmesh sell data",
      "smart ring privacy",
      "wearable data eu cloud",
    ],
  },
  tldr: {
    it: [
      "I tuoi dati salute stanno sul tuo account FitMesh, su server nell'Unione Europea, non su server del produttore del dispositivo.",
      "FitMesh non vende i tuoi dati e non mostra pubblicità: il servizio si sostiene con il prezzo del Pro, non con i tuoi dati.",
      "Il trattamento segue il GDPR: puoi vedere, esportare o cancellare i tuoi dati quando vuoi.",
      "Molte app 'gratis per sempre' si finanziano vendendo dati o riempiendo lo schermo di pubblicità: è per questo che FitMesh preferisce un prezzo piccolo e chiaro.",
      "Cancellare l'account rimuove i dati collegati, non solo l'accesso.",
    ],
    en: [
      "Your health data lives on your FitMesh account, on servers in the European Union, not on the device maker's servers.",
      "FitMesh doesn't sell your data and shows no ads: the service is funded by the Pro price, not by your data.",
      "Handling follows GDPR: you can view, export or delete your data whenever you want.",
      "Many 'free forever' apps fund themselves by selling data or filling the screen with ads: that's exactly why FitMesh prefers a small, clear price instead.",
      "Deleting your account removes the linked data, not just your access.",
    ],
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "FitMesh Sync conserva i tuoi dati salute (passi, battito, sonno, SpO2, allenamenti) sul tuo account, su server nell'Unione Europea. Non li vendiamo, non li condividiamo con inserzionisti e non mostriamo pubblicità nell'app. Il servizio si sostiene con il prezzo del Pro (un piccolo abbonamento o uno sblocco a vita), non monetizzando i tuoi dati. Questa pagina spiega esattamente cosa succede ai tuoi dati quando colleghi un wearable, dove vivono, chi può vederli e come cancellarli, se vuoi.",
        en: "FitMesh Sync stores your health data (steps, heart rate, sleep, SpO2, workouts) on your account, on servers in the European Union. We don't sell it, don't share it with advertisers, and show no ads in the app. The service is funded by the price of Pro (a small subscription or a lifetime unlock), not by monetizing your data. This page explains exactly what happens to your data when you connect a wearable, where it lives, who can see it, and how to delete it if you want to.",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: { it: "Risposta rapida", en: "Quick answer" },
      body: {
        it: "I tuoi dati stanno sul tuo account, su server in UE, protetti secondo il GDPR. FitMesh non li vende e non mostra pubblicità: il servizio si sostiene col prezzo del Pro. Puoi vederli, esportarli o cancellarli quando vuoi.",
        en: "Your data lives on your account, on EU servers, protected under GDPR. FitMesh doesn't sell it and shows no ads: the service is funded by the price of Pro. You can view, export or delete it whenever you want.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Perché dovrebbe interessarti, prima ancora di installare",
        en: "Why this should matter, even before you install",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Collegare un'app a un anello o a uno smartwatch significa darle accesso a dati piuttosto intimi: quando dormi, quanto ti muovi, come batte il tuo cuore. È una domanda legittima chiedersi cosa ne facciamo prima ancora di guardare le funzioni. La risposta breve è che trattiamo i tuoi dati come li tratteresti tu: restano tuoi, li usiamo solo per mostrarteli nella dashboard, e non li giriamo a nessuno per pubblicità o rivendita.",
        en: "Connecting an app to a ring or smartwatch means giving it access to fairly intimate data: when you sleep, how much you move, how your heart beats. It's a fair question to ask what we do with it before you even look at the features. The short answer is that we treat your data the way you would want it treated: it stays yours, we use it only to show it back to you in the dashboard, and we never pass it to anyone for ads or resale.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Il modello di molte app gratuite: paghi con i tuoi dati",
        en: "The model behind many free apps: you pay with your data",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il panorama delle app che uniscono dati wearable è pieno di servizi 'gratis per sempre'. Quel gratis, quasi sempre, si paga altrove: con la pubblicità mirata, con la vendita di dati aggregati a terzi, o con funzioni essenziali chiuse dietro un secondo abbonamento nascosto. Non è un giudizio su chi lo fa, è economia: un servizio che legge dati, li elabora e li mostra ha un costo reale di gestione, e va coperto in qualche modo. Noi abbiamo scelto di coprirlo con un prezzo diretto e piccolo, non con i tuoi dati.",
        en: "The landscape of apps that merge wearable data is full of 'free forever' services. That free is almost always paid for elsewhere: with targeted ads, with aggregated data sold to third parties, or with essential features locked behind a second, hidden subscription. This isn't a judgment on anyone who does it, it's economics: a service that reads data, processes it and shows it back has a real running cost, and it has to be covered somehow. We chose to cover it with a direct, small price, not with your data.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Cosa succede davvero ai tuoi dati con FitMesh",
        en: "What actually happens to your data with FitMesh",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Quando colleghi un wearable, FitMesh legge i dati (via Health Connect su Android o direttamente dall'anello Colmi via Bluetooth), li deduplica se più fonti coprono lo stesso intervallo, e li salva sul tuo account, su server nell'Unione Europea. Da lì li vedi nell'app e nella dashboard web, con lo stesso account, da qualsiasi browser. Nessun altro utente, nessun inserzionista e nessun servizio terzo li vede: restano sul tuo account, punto.",
        en: "When you connect a wearable, FitMesh reads the data (via Health Connect on Android or directly from the Colmi ring over Bluetooth), deduplicates it if multiple sources cover the same window, and saves it to your account, on servers in the European Union. From there you see it in the app and in the web dashboard, with the same account, from any browser. No other user, no advertiser and no third-party service sees it: it stays on your account, full stop.",
      },
    },
    {
      type: "table",
      caption: {
        it: "Cosa fa FitMesh (e cosa non fa) con i tuoi dati",
        en: "What FitMesh does (and doesn't do) with your data",
      },
      headers: {
        it: ["Domanda", "Risposta"],
        en: ["Question", "Answer"],
      },
      rows: [
        {
          it: ["Dove sono conservati i dati", "Su server nell'Unione Europea, sul tuo account"],
          en: ["Where is the data stored", "On servers in the European Union, on your account"],
        },
        {
          it: ["Vendiamo i tuoi dati a terzi", "No, mai"],
          en: ["Do we sell your data to third parties", "No, never"],
        },
        {
          it: ["Mostriamo pubblicità nell'app", "No"],
          en: ["Do we show ads in the app", "No"],
        },
        {
          it: ["Puoi esportare i tuoi dati", "Sì, dalle impostazioni dell'app"],
          en: ["Can you export your data", "Yes, from the app settings"],
        },
        {
          it: ["Puoi cancellare i tuoi dati", "Sì, eliminando l'account"],
          en: ["Can you delete your data", "Yes, by deleting your account"],
        },
        {
          it: ["Base legale del trattamento", "GDPR (regolamento UE)"],
          en: ["Legal basis for processing", "GDPR (EU regulation)"],
        },
      ],
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Perché il prezzo piccolo è collegato alla privacy",
        en: "Why the small price is tied to privacy",
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Non è un caso che FitMesh abbia un prezzo (piccolo: circa un caffè ogni sei mesi, o meno di una pizza per lo sblocco a vita) invece di essere gratis per sempre. È esattamente il prezzo a permetterci di non dover monetizzare i tuoi dati in altro modo. Trovi il dettaglio completo del modello, incluso il posto founder per i primi 1000 iscritti, nella guida [FitMesh è gratis? Prezzo e posti founder](/it/blog/fitmesh-gratis-prezzo-founder). Se vuoi il dettaglio legale completo su come trattiamo i dati secondo il GDPR, c'è la guida dedicata su [GDPR e dati fitness](/it/blog/gdpr-dati-fitness-smartwatch).",
        en: "It's not a coincidence that FitMesh has a price (a small one: about a coffee every six months, or less than a pizza for the lifetime unlock) instead of being free forever. That price is exactly what lets us avoid monetizing your data any other way. You'll find the full model, including the founder spot for the first 1,000 sign-ups, in the guide [Is FitMesh free? Pricing and founder spots](/en/blog/fitmesh-gratis-prezzo-founder). For the full legal detail on how we handle data under GDPR, there's a dedicated guide on [GDPR and fitness data](/en/blog/gdpr-dati-fitness-smartwatch).",
      },
    },
    {
      type: "cta",
      title: {
        it: "Prova FitMesh sapendo dove vanno i tuoi dati",
        en: "Try FitMesh knowing exactly where your data goes",
      },
      body: {
        it: "Server in UE, nessuna pubblicità, nessuna vendita dei dati. I primi 1000 iscritti founder (programma chiuso dal 31 luglio 2026) hanno ricevuto il Pro a vita gratis; tutti gli altri hanno 14 giorni di prova completa.",
        en: "EU servers, no ads, no data sold. The first 1,000 founder sign-ups (program closed as of July 31, 2026) got lifetime Pro free; everyone else gets a full 14-day trial.",
      },
      ctaLabel: { it: "Unisciti alla beta →", en: "Join the beta →" },
      ctaHref: { it: "/it/beta", en: "/en/beta" },
    },
  ],
  faq: [
    {
      q: { it: "Dove sono fisicamente conservati i miei dati?", en: "Where is my data physically stored?" },
      a: {
        it: "Su server nell'Unione Europea, sul tuo account FitMesh. Non sui server del produttore del tuo wearable.",
        en: "On servers in the European Union, on your FitMesh account. Not on your wearable maker's servers.",
      },
    },
    {
      q: { it: "FitMesh vende i miei dati?", en: "Does FitMesh sell my data?" },
      a: {
        it: "No. Non vendiamo i tuoi dati a terzi e non li usiamo per pubblicità. Il servizio si sostiene con il prezzo del Pro, non con i tuoi dati.",
        en: "No. We don't sell your data to third parties and don't use it for advertising. The service is funded by the price of Pro, not by your data.",
      },
    },
    {
      q: { it: "Chi può vedere i miei dati salute?", en: "Who can see my health data?" },
      a: {
        it: "Solo tu, con il tuo account. Nessun altro utente, inserzionista o servizio terzo ha accesso ai tuoi dati.",
        en: "Only you, with your account. No other user, advertiser or third-party service has access to your data.",
      },
    },
    {
      q: { it: "FitMesh è conforme al GDPR?", en: "Is FitMesh GDPR compliant?" },
      a: {
        it: "Sì. Il trattamento segue il GDPR: puoi vedere, esportare o cancellare i tuoi dati quando vuoi. Il dettaglio completo è nella guida su GDPR e dati fitness.",
        en: "Yes. Data handling follows GDPR: you can view, export or delete your data whenever you want. Full detail is in the guide on GDPR and fitness data.",
      },
    },
    {
      q: { it: "Posso cancellare i miei dati?", en: "Can I delete my data?" },
      a: {
        it: "Sì. Eliminando l'account rimuovi anche i dati collegati, non solo l'accesso all'app.",
        en: "Yes. Deleting your account removes the linked data too, not just your access to the app.",
      },
    },
    {
      q: {
        it: "Perché altre app di questo tipo sono gratis se FitMesh ha un prezzo?",
        en: "Why are other apps like this free if FitMesh has a price?",
      },
      a: {
        it: "Spesso quel gratis si paga altrove: pubblicità, vendita di dati aggregati o funzioni essenziali chiuse dietro un secondo abbonamento. FitMesh preferisce un prezzo piccolo e diretto, che copre il costo reale del servizio senza dover monetizzare i tuoi dati.",
        en: "Often that free is paid for elsewhere: ads, aggregated data sold on, or essential features locked behind a second subscription. FitMesh prefers a small, direct price that covers the real cost of the service without having to monetize your data.",
      },
    },
  ],
  related: [
    "gdpr-dati-fitness-smartwatch",
    "fitmesh-gratis-prezzo-founder",
    "come-funziona-fitmesh",
    "colmi-ring-fitmesh",
  ],
  ldType: "BlogPosting",
};
