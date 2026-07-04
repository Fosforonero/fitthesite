import type { BlogPost } from "../types";

/**
 * Annuncio news: Mesh Famiglia sta per arrivare (COMING_SOON=true su
 * /famiglia al momento della scrittura). Condivisione simmetrica tra pari
 * ("tu condividi, loro condividono"), non monitoraggio caregiver->anziano.
 * Framing pricing allineato alla landing corrente (14gg prova -> Pro, tetto
 * 8 membri), non alla vecchia tabella free=3/Pro=8 dello spec design.
 * it/en; gli altri locali si aggiungono dopo.
 */
export const post: BlogPost = {
  slug: "mesh-famiglia-lancio",
  category: "news",
  publishedAt: "2026-07-04",
  updatedAt: "2026-07-04",
  readMinutes: 6,
  hero: {
    kicker: { it: "Novità", en: "What's New" },
    title: {
      it: "Mesh Famiglia sta per arrivare: la salute di tutta la famiglia in un'unica dashboard",
      en: "Family Mesh is coming: your whole family's health in one dashboard",
    },
    subtitle: {
      it: "Crei un gruppo, inviti chi vuoi, e ognuno condivide con gli altri passi, sonno e frequenza cardiaca nella stessa dashboard. Nei prossimi giorni Mesh Famiglia arriva su FitMesh: ecco come funzionerà davvero, dai preset di privacy a quanto costa.",
      en: "You create a group, invite anyone you like, and everyone shares steps, sleep and heart rate with each other in the same dashboard. In the coming days, Family Mesh arrives on FitMesh: here's exactly how it will work, from privacy presets to pricing.",
    },
  },
  metaDescription: {
    it: "Mesh Famiglia sta per arrivare su FitMesh: crei un gruppo, ognuno sceglie cosa condividere con gli altri. Ecco come funzionerà, privacy e costi inclusi.",
    en: "Family Mesh is coming soon to FitMesh: create a group, everyone chooses what to share with the others. Here's exactly how it will work, privacy and pricing included.",
  },
  primaryKeyword: {
    it: "mesh famiglia fitmesh",
    en: "fitmesh family mesh",
  },
  secondaryKeywords: {
    it: [
      "condividere dati fitness in famiglia",
      "app famiglia passi sonno frequenza cardiaca",
      "dashboard famiglia FitMesh",
      "gruppo famiglia wearable",
      "privacy dati famiglia fitness",
      "quando esce mesh famiglia",
    ],
    en: [
      "share fitness data with family",
      "family steps sleep heart rate app",
      "FitMesh family dashboard",
      "wearable family group",
      "family fitness data privacy",
      "when does family mesh launch",
    ],
  },
  tldr: {
    it: [
      "Mesh Famiglia è la nuova funzione di FitMesh in arrivo nei prossimi giorni: crei un gruppo e ogni membro condivide con gli altri passi, sonno e frequenza cardiaca nella stessa dashboard.",
      "È condivisione simmetrica tra pari, non un monitoraggio a senso unico: non esiste un membro che osserva gli altri senza essere osservato a sua volta, e niente allerte tipo 'non sincronizza da ore'.",
      "Ognuno sceglie cosa condividere con un preset di privacy (Solo attività, Salute base di default, Salute completa, Personalizza), modificabile in ogni momento.",
      "L'invito funziona con un link o un codice MESH-XXXX: chi lo riceve installa l'app e si unisce in pochi minuti, anche senza esperienza tecnica.",
      "Ogni persona ha 14 giorni di prova gratuita di tutte le funzioni; con FitMesh Pro la Mesh Famiglia arriva fino a 8 membri.",
    ],
    en: [
      "Family Mesh is the new FitMesh feature arriving in the coming days: you create a group and every member shares steps, sleep and heart rate with the others in the same dashboard.",
      "It's symmetric peer sharing, not one-way monitoring: no member watches the others without being watched back, and there are no alerts like 'hasn't synced in hours'.",
      "Everyone chooses what to share with a privacy preset (Activity only, Basic health as default, Full health, Customize), editable at any time.",
      "Invites work with a link or a MESH-XXXX code: whoever receives it installs the app and joins in minutes, even with zero technical experience.",
      "Everyone gets a 14-day free trial of all features; with FitMesh Pro, Family Mesh holds up to 8 members.",
    ],
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Nei prossimi giorni arriva Mesh Famiglia, la funzione di FitMesh pensata per chi vuole restare in contatto con la salute della propria famiglia senza vivere sotto lo stesso tetto. L'idea è semplice: crei un gruppo, inviti chi vuoi (genitori, partner, figli), e da quel momento ognuno condivide con gli altri passi, sonno e frequenza cardiaca nella stessa dashboard. Non è un servizio di monitoraggio a senso unico: è una mesh, una rete tra pari. Tu condividi, loro condividono.",
        en: "In the coming days, Family Mesh arrives on FitMesh, a feature built for anyone who wants to stay in touch with their family's health without living under the same roof. The idea is simple: you create a group, invite anyone you like (parents, partner, kids), and from that moment everyone shares steps, sleep and heart rate with each other in the same dashboard. This isn't one-way monitoring: it's a mesh, a network of equals. You share, they share.",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: { it: "Risposta rapida", en: "Quick answer" },
      body: {
        it: "Mesh Famiglia arriva nei prossimi giorni. Crei un gruppo, inviti fino a 7 altre persone con un link o un codice, e ognuno sceglie cosa condividere con gli altri (passi, sonno e frequenza cardiaca di default; peso, pressione e altri dati solo se lo si attiva esplicitamente). Non c'è un admin che controlla gli altri: è condivisione reciproca, non sorveglianza.",
        en: "Family Mesh is coming in the next few days. You create a group, invite up to 7 other people with a link or a code, and everyone chooses what to share with the others (steps, sleep and heart rate by default; weight, blood pressure and other data only if turned on explicitly). There's no admin who monitors the others: it's mutual sharing, not surveillance.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Perché una mesh, non un monitoraggio", en: "Why a mesh, not monitoring" },
    },
    {
      type: "paragraph",
      text: {
        it: "Molte app pensate per 'la famiglia' funzionano con una logica a senso unico: un familiare controlla, un altro viene controllato. Mesh Famiglia funziona diversamente. Chi crea il gruppo resta il proprietario dal punto di vista tecnico (può gestire gli inviti o chiudere il gruppo), ma non ha nessun ruolo di supervisione sugli altri membri: tutti vedono i dati che gli altri hanno scelto di condividere, e tutti sono visti allo stesso modo. Non troverai notifiche tipo 'papà non sincronizza da 12 ore': quel tipo di allerta ansiogena non fa parte di questa funzione, che resta pensata per condividere, non per controllare.",
        en: "Many apps built for 'the family' work with a one-way logic: one family member monitors, another gets monitored. Family Mesh works differently. Whoever creates the group is technically the owner (they can manage invites or close the group), but they have no supervisory role over the other members: everyone sees the data the others have chosen to share, and everyone is seen the same way. You won't find notifications like 'dad hasn't synced in 12 hours': that kind of anxiety-inducing alert isn't part of this feature, which is built for sharing, not for surveillance.",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Genitori e figli adulti che vivono altrove.** Non serve chiedere 'hai camminato oggi?' via messaggio: lo vedi già nella dashboard condivisa, e anche loro vedono i tuoi dati allo stesso modo.",
          "**Famiglie con figli adolescenti.** Ognuno ha il proprio smartwatch o anello, magari di marca diversa: nella Mesh vedete comunque gli stessi tipi di dati, senza dover aprire app diverse o confrontare numeri a voce.",
          "**Partner e conviventi.** Lavorate in posti diversi e vi vedete la sera: sapere che lei ha fatto i suoi passi o che lui ha dormito bene è un piccolo modo di tenersi d'occhio a distanza, senza essere invadenti.",
        ],
        en: [
          "**Parents and adult kids living apart.** No need to text 'did you walk today?': you already see it in the shared dashboard, and they see your data the same way.",
          "**Families with teenagers.** Everyone has their own smartwatch or ring, maybe a different model: in the Mesh you still see the same kinds of data, without opening different apps or comparing numbers out loud.",
          "**Partners and cohabiting couples.** You work in different places and see each other in the evening: knowing she hit her steps or he slept well is a small way of looking out for each other from a distance, without being intrusive.",
        ],
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Come funzionerà, in tre passaggi", en: "How it will work, in three steps" },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "**Crei il gruppo.** Gli dai un nome (es. 'Famiglia Rossi') e diventi il primo membro.",
          "**Inviti chi vuoi.** Con un link o un codice nel formato MESH-XXXX, condivisibile su WhatsApp, SMS o email. Il codice resta valido 7 giorni; chi non ha ancora l'app viene indirizzato a scaricarla e si unisce in automatico al primo avvio.",
          "**Ognuno sceglie cosa condividere.** Con un preset di privacy, modificabile in qualsiasi momento dalle impostazioni, senza bisogno del permesso di nessun altro membro.",
        ],
        en: [
          "**You create the group.** Give it a name (e.g. 'The Smiths') and you become the first member.",
          "**You invite anyone you like.** With a link or a MESH-XXXX code, shareable over WhatsApp, SMS or email. The code stays valid for 7 days; anyone without the app yet gets sent to install it and joins automatically on first launch.",
          "**Everyone chooses what to share.** With a privacy preset, editable at any time from settings, without needing anyone else's permission.",
        ],
      },
    },
    {
      type: "table",
      caption: { it: "I preset di privacy di Mesh Famiglia", en: "Family Mesh privacy presets" },
      headers: { it: ["Preset", "Cosa condivide"], en: ["Preset", "What it shares"] },
      rows: [
        {
          it: ["Solo attività", "Passi, allenamenti, calorie"],
          en: ["Activity only", "Steps, workouts, calories"],
        },
        {
          it: ["Salute base (default)", "Anche sonno e frequenza cardiaca"],
          en: ["Basic health (default)", "Also sleep and heart rate"],
        },
        {
          it: ["Salute completa", "Anche peso, pressione e glicemia"],
          en: ["Full health", "Also weight, blood pressure and glucose"],
        },
        {
          it: ["Personalizza", "Ogni metrica scelta singolarmente, una per una"],
          en: ["Customize", "Each metric chosen individually, one by one"],
        },
      ],
    },
    {
      type: "heading",
      level: 2,
      text: {
        it: "Quello che vedono gli altri, quello che non vedono mai",
        en: "What others see, and what they never see",
      },
    },
    {
      type: "comparison",
      aTitle: { it: "Cosa vedono gli altri membri", en: "What other members see" },
      aItems: {
        it: [
          "Il nome che il membro ha scelto (es. 'Mamma', 'Luca')",
          "Il conteggio passi giornaliero",
          "Le ore di sonno totali",
          "La frequenza cardiaca media e a riposo",
          "Il livello di attività generico (basso, medio, alto)",
        ],
        en: [
          "The name the member chose (e.g. 'Mom', 'Luca')",
          "Daily step count",
          "Total hours of sleep",
          "Average and resting heart rate",
          "Generic activity level (low, medium, high)",
        ],
      },
      bTitle: { it: "Cosa non vede mai", en: "What is never visible" },
      bItems: {
        it: [
          "La posizione geografica del membro",
          "Peso e composizione corporea",
          "Ciclo mestruale",
          "Pressione, glicemia e altri dati medici sensibili",
          "Notifiche, messaggi e contatti del telefono",
        ],
        en: [
          "The member's geographic location",
          "Weight and body composition",
          "Menstrual cycle",
          "Blood pressure, glucose and other sensitive medical data",
          "Notifications, messages and phone contacts",
        ],
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il preset 'Salute completa' fa eccezione per peso, pressione e glicemia: chi possiede quel dato può scegliere di condividerlo, ma resta sempre una scelta esplicita sua. Nessuno vede queste informazioni finché non sei tu ad attivarle. Posizione, notifiche e contatti del telefono restano invece fuori dalla Mesh in ogni caso: FitMesh non li raccoglie né li condivide, con questa funzione o senza.",
        en: "The 'Full health' preset is the one exception, for weight, blood pressure and glucose: whoever owns that data can choose to share it, but it's always their explicit choice. Nobody sees that information until you turn it on yourself. Location, notifications and phone contacts stay out of the Mesh no matter what: FitMesh doesn't collect or share them, with this feature or without it.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Quanto costerà", en: "What it will cost" },
    },
    {
      type: "paragraph",
      text: {
        it: "Mesh Famiglia è una funzione di FitMesh Pro, ma non serve attivare nulla prima di provarla: ogni persona che entra nel gruppo, incluso chi si unisce tramite invito, ha 14 giorni di prova gratuita di tutte le funzioni dell'app. Passato questo periodo, per restare nella Mesh serve FitMesh Pro, a vita (acquisto unico, prezzo di lancio di €3,99 su Android e €4,99 su iPhone) oppure con l'abbonamento leggero da €1,19 ogni sei mesi. Con Pro attivo, il gruppo arriva fino a 8 membri, te incluso.",
        en: "Family Mesh is a FitMesh Pro feature, but there's nothing to activate before trying it: everyone who joins the group, including anyone brought in by invite, gets a 14-day free trial of every feature in the app. After that, staying in the Mesh requires FitMesh Pro, either for life (one-time purchase, launch price of €3.99 on Android and €4.99 on iPhone) or with the lighter subscription at €1.19 every six months. With Pro active, the group holds up to 8 members, including you.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Quando arriva davvero", en: "When it actually arrives" },
    },
    {
      type: "paragraph",
      text: {
        it: "Il rilascio di Mesh Famiglia è previsto nei prossimi giorni: non è ancora attiva mentre scriviamo questo articolo. Nel frattempo trovi tutti i dettagli, e puoi iscriverti per essere avvisato non appena la funzione va live, nella pagina dedicata a Mesh Famiglia.",
        en: "Family Mesh is expected to launch in the coming days: it isn't live yet as we write this. In the meantime you'll find all the details, and you can sign up to be notified the moment the feature goes live, on the dedicated Family Mesh page.",
      },
    },
    {
      type: "cta",
      title: {
        it: "Preparati a creare la tua Mesh Famiglia",
        en: "Get ready to create your Family Mesh",
      },
      body: {
        it: "Nei prossimi giorni potrai creare un gruppo, invitare chi vuoi e condividere passi, sonno e frequenza cardiaca con la tua famiglia, in un'unica dashboard. Scopri tutti i dettagli nella pagina dedicata.",
        en: "In the coming days you'll be able to create a group, invite anyone you like, and share steps, sleep and heart rate with your family, in one dashboard. Find all the details on the dedicated page.",
      },
      ctaLabel: { it: "Scopri Mesh Famiglia →", en: "Discover Family Mesh →" },
      ctaHref: { it: "/it/famiglia", en: "/en/famiglia" },
    },
  ],
  faq: [
    {
      q: {
        it: "Un familiare non è molto pratico con la tecnologia. Riuscirà a usarla?",
        en: "A family member isn't very tech-savvy. Will they be able to use it?",
      },
      a: {
        it: "Sì. Una volta installata l'app e cliccato il link di invito che gli mandi, non deve fare nient'altro: l'app sincronizza da sola in background e il resto della famiglia vede i suoi dati dalla propria app. Non deve aprire più nulla.",
        en: "Yes. Once the app is installed and they tap the invite link you send, they don't need to do anything else: the app syncs on its own in the background, and the rest of the family sees their data in their own app. They never need to open anything again.",
      },
    },
    {
      q: {
        it: "Potrò vedere la posizione dei membri della Mesh?",
        en: "Will I be able to see the location of Mesh members?",
      },
      a: {
        it: "No, mai. FitMesh non raccoglie né condivide dati di posizione, con Mesh Famiglia o senza. Se cerchi quel tipo di funzione, serve un'app dedicata.",
        en: "No, never. FitMesh does not collect or share location data, with Family Mesh or without it. If you need that kind of feature, you'll need a dedicated app.",
      },
    },
    {
      q: {
        it: "Cosa succede se un membro vuole uscire dal gruppo?",
        en: "What happens if a member wants to leave the group?",
      },
      a: {
        it: "Basta che lo faccia dalle impostazioni del gruppo, dal proprio telefono. I suoi dati storici vengono rimossi dalla vista degli altri membri, senza bisogno dell'autorizzazione di nessuno.",
        en: "They just do it from the group settings, on their own phone. Their historical data is removed from the other members' view, with no approval needed from anyone.",
      },
    },
    {
      q: {
        it: "Chi crea il gruppo ha più controllo sugli altri membri?",
        en: "Does whoever creates the group have more control over the others?",
      },
      a: {
        it: "No. Chi crea il gruppo resta tecnicamente il proprietario (può ad esempio gestire gli inviti o chiudere il gruppo), ma non vede più dati degli altri membri né ha un ruolo di supervisione su di loro. La condivisione è sempre reciproca.",
        en: "No. Whoever creates the group is technically the owner (they can manage invites or close the group, for example), but they don't see more of the others' data and have no supervisory role over them. Sharing is always mutual.",
      },
    },
    {
      q: {
        it: "Quante persone potrò invitare?",
        en: "How many people will I be able to invite?",
      },
      a: {
        it: "Con FitMesh Pro la Mesh Famiglia arriva fino a 8 membri, te incluso. Ogni persona prova tutte le funzioni gratis per 14 giorni prima di dover attivare Pro.",
        en: "With FitMesh Pro, Family Mesh holds up to 8 members, including you. Everyone gets a 14-day free trial of all features before needing to activate Pro.",
      },
    },
    {
      q: {
        it: "Quando sarà disponibile Mesh Famiglia?",
        en: "When will Family Mesh be available?",
      },
      a: {
        it: "Il rilascio è previsto nei prossimi giorni. Trovi lo stato più aggiornato, e puoi iscriverti per essere avvisato, nella pagina dedicata a Mesh Famiglia.",
        en: "The release is expected in the coming days. You'll find the latest status, and can sign up to be notified, on the dedicated Family Mesh page.",
      },
    },
  ],
  related: [
    "dove-sono-i-tuoi-dati-server-ue",
    "gdpr-dati-fitness-smartwatch",
    "come-funziona-fitmesh",
    "novita-dashboard-multi-device",
  ],
  ldType: "BlogPosting",
};
