import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "gdpr-dati-fitness-smartwatch",
  category: "privacy",
  publishedAt: "2026-05-21",
  updatedAt: "2026-05-21",
  readMinutes: 10,
  primaryKeyword: {
    it: "gdpr dati fitness",
    en: "gdpr fitness data",
  },
  secondaryKeywords: {
    it: [
      "dati salute smartwatch privacy",
      "dove finiscono dati fitbit",
      "smartwatch gdpr",
      "diritto cancellazione dati fitness",
    ],
    en: [
      "smartwatch health data privacy",
      "where does fitbit data go",
      "smartwatch gdpr",
      "fitness data deletion right",
    ],
  },
  metaDescription: {
    it: "Dove finiscono i dati del tuo smartwatch sotto GDPR: cosa sono dati sanitari, basi legali, diritti reali, e come ogni grande brand gestisce i tuoi BPM nella pratica.",
    en: "Where your smartwatch data ends up under GDPR: what counts as health data, legal bases, actual rights, and how each major brand handles your heart rate in practice.",
  },
  hero: {
    kicker: { it: "Privacy", en: "Privacy" },
    title: {
      it: "GDPR e dati fitness: dove finiscono i tuoi dati",
      en: "GDPR and fitness data: where your smartwatch data actually ends up",
    },
    subtitle: {
      it: "Cosa dice il regolamento, cosa fanno davvero i brand, e cosa puoi pretendere se sei in Europa. Senza isteria, con esempi concreti.",
      en: "What the regulation says, what brands actually do, and what you can demand if you're in Europe. No hysteria, concrete examples.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "I dati del tuo smartwatch (frequenza cardiaca, sonno, ciclo mestruale, peso, attività) sono dati sanitari secondo il GDPR art. 4 n. 15: il regolamento li sottopone a regole più severe rispetto a email o cronologia di acquisto, e ogni brand che li raccoglie deve rispettare obblighi precisi nei confronti degli utenti europei. Questo articolo spiega cosa significano questi obblighi in pratica e come far valere i tuoi diritti.",
        en: "Your smartwatch data (heart rate, sleep, menstrual cycle, weight, activity) qualifies as health data under GDPR art. 4 no. 15: the regulation subjects it to stricter rules than email addresses or purchase history, and every brand collecting it must meet precise obligations toward European users. This article explains what those obligations mean in practice and how to exercise your rights.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Cosa conta come 'dato sanitario' secondo GDPR", en: "What counts as 'health data' under GDPR" },
    },
    {
      type: "paragraph",
      text: {
        it: "Categoria 'speciale' (art. 9): il trattamento è in principio vietato salvo eccezioni esplicite. Le eccezioni rilevanti per smartwatch sono due: consenso esplicito (art. 9.2.a) e finalità di assistenza/medicina del lavoro/sanità pubblica (9.2.h-i). Praticamente tutti i produttori consumer si basano sul consenso esplicito che dai accettando i ToS al primo avvio.",
        en: "'Special' category (art. 9): processing is in principle forbidden except for explicit exceptions. The relevant exceptions for smartwatches are two: explicit consent (art. 9.2.a) and care/occupational medicine/public health purposes (9.2.h-i). Practically all consumer manufacturers rely on the explicit consent you give when accepting ToS at first launch.",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "Frequenza cardiaca: dato sanitario.",
          "Ciclo mestruale (Cycle Tracking di Apple Watch, Cycle Withings, etc.): dato sanitario sensibile.",
          "Sonno per fasi (REM, Deep, Light, Awake): dato sanitario.",
          "ECG: dato sanitario medicale.",
          "SpO₂: dato sanitario.",
          "Passi giornalieri: borderline. Alcuni Garanti li classificano come sanitari se collegati a una persona identificabile, altri come dati personali standard.",
          "GPS track allenamenti: dati personali (non sanitari di per sé), ma profilo localizzato che può rivelare residenza/luogo di lavoro/abitudini.",
        ],
        en: [
          "Heart rate: health data.",
          "Menstrual cycle (Apple Watch Cycle Tracking, Withings Cycle, etc.): sensitive health data.",
          "Sleep by stages (REM, Deep, Light, Awake): health data.",
          "ECG: medical health data.",
          "SpO₂: health data.",
          "Daily steps: borderline. Some DPAs classify them as health if linked to an identifiable person, others as standard personal data.",
          "Workout GPS tracks: personal data (not health-related per se), but a localized profile that can reveal residence/workplace/habits.",
        ],
      },
    },
    {
      type: "callout",
      variant: "info",
      title: { it: "Perché conta la classificazione", en: "Why classification matters" },
      body: {
        it: "Per i dati sanitari il consenso deve essere informato, specifico, granulare e revocabile. 'Accetta tutto' su un wall di consenso scuro non è valido. Se un brand cinese o americano tratta i tuoi dati sanitari con una clausola unica generica, è probabilmente in violazione del GDPR, indipendentemente da dove sia il server.",
        en: "For health data consent must be informed, specific, granular and revocable. 'Accept all' on a dark consent wall isn't valid. If a Chinese or American brand processes your health data under a single generic clause, it's likely in GDPR violation, regardless of where the server is.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Dove finiscono fisicamente i tuoi dati", en: "Where your data physically ends up" },
    },
    {
      type: "paragraph",
      text: {
        it: "La privacy policy di ogni brand dichiara in che paesi sono ospitati i server. Riepilogo basato sulle policy pubbliche al 2026:",
        en: "Each brand's privacy policy declares which countries host servers. Summary based on public policies as of 2026:",
      },
    },
    {
      type: "table",
      headers: {
        it: ["Brand", "Server primari dati EU", "Trasferimenti fuori UE"],
        en: ["Brand", "Primary EU data servers", "Non-EU transfers"],
      },
      rows: [
        {
          it: ["Apple", "Irlanda + Danimarca", "USA per processing analytics (SCC)"],
          en: ["Apple", "Ireland + Denmark", "USA for analytics processing (SCC)"],
        },
        {
          it: ["Google (Fitbit/Pixel)", "Belgio + Olanda + Finlandia", "USA (DPF + SCC)"],
          en: ["Google (Fitbit/Pixel)", "Belgium + Netherlands + Finland", "USA (DPF + SCC)"],
        },
        {
          it: ["Samsung", "Olanda + Germania", "Sud Corea per backup; USA per Health Cloud (SCC)"],
          en: ["Samsung", "Netherlands + Germany", "South Korea for backup; USA for Health Cloud (SCC)"],
        },
        {
          it: ["Garmin", "Olanda + Stati Uniti", "USA come default (SCC + DPF)"],
          en: ["Garmin", "Netherlands + USA", "USA as default (SCC + DPF)"],
        },
        {
          it: ["Polar", "Finlandia", "Limitati a processing analytics"],
          en: ["Polar", "Finland", "Limited to analytics processing"],
        },
        {
          it: ["Withings", "Francia", "Limitati"],
          en: ["Withings", "France", "Limited"],
        },
        {
          it: ["Oura", "Irlanda", "USA per processing (SCC)"],
          en: ["Oura", "Ireland", "USA for processing (SCC)"],
        },
        {
          it: ["Xiaomi", "Germania", "Singapore + Cina (con SCC; con riserve interpretative GDPR)"],
          en: ["Xiaomi", "Germany", "Singapore + China (with SCC; with GDPR interpretation caveats)"],
        },
        {
          it: ["Huawei", "Olanda + Germania", "Cina (situazione complessa, leggere TOS)"],
          en: ["Huawei", "Netherlands + Germany", "China (complex situation, read TOS)"],
        },
      ],
    },
    {
      type: "callout",
      variant: "warning",
      title: { it: "USA e Cina hanno regimi diversi", en: "USA and China have different regimes" },
      body: {
        it: "Trasferimenti USA dopo Schrems II sono ammessi via Data Privacy Framework (luglio 2023, sotto rinegoziazione) o Standard Contractual Clauses. Trasferimenti verso Cina sono molto più problematici: il framework legale cinese (Cybersecurity Law + DSL + PIPL) consente accesso governativo ai dati ospitati su server cinesi senza garanzie equivalenti GDPR. Per dati sanitari, valuta caso per caso.",
        en: "USA transfers after Schrems II are allowed via Data Privacy Framework (July 2023, under renegotiation) or Standard Contractual Clauses. Transfers to China are much more problematic: the Chinese legal framework (Cybersecurity Law + DSL + PIPL) allows government access to data hosted on Chinese servers without GDPR-equivalent guarantees. For health data, evaluate case by case.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "I tuoi diritti, in pratica", en: "Your rights, in practice" },
    },
    {
      type: "heading",
      level: 3,
      text: { it: "Diritto di accesso (art. 15)", en: "Right of access (art. 15)" },
    },
    {
      type: "paragraph",
      text: {
        it: "Puoi chiedere a qualsiasi titolare una copia di tutti i dati che ha su di te. Hanno 30 giorni (estendibili a 90 in casi complessi). Gratis. Il dataset deve essere intelligibile (no dump binari indecifrabili).",
        en: "You can ask any controller for a copy of all data they have about you. They have 30 days (extendible to 90 in complex cases). Free. The dataset must be intelligible (no indecipherable binary dumps).",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "Apple: tramite privacy.apple.com (anche per dati Health iCloud).",
          "Google/Fitbit: tramite takeout.google.com.",
          "Samsung: tramite privacy.samsung.com/it/privacy-rights.",
          "Garmin: tramite dashboard account → Privacy → 'Export data'.",
          "Polar: tramite flow.polar.com → impostazioni profilo.",
          "Withings: tramite account.withings.com → privacy.",
          "Oura: tramite cloud.ouraring.com → settings → export.",
          "Xiaomi: tramite privacy.mi.com.",
          "Per ogni altro: email a privacy@[brand].com (sono tenuti a fornire un canale).",
        ],
        en: [
          "Apple: via privacy.apple.com (Health iCloud data included).",
          "Google/Fitbit: via takeout.google.com.",
          "Samsung: via privacy.samsung.com/en/privacy-rights.",
          "Garmin: via account dashboard → Privacy → 'Export data'.",
          "Polar: via flow.polar.com → profile settings.",
          "Withings: via account.withings.com → privacy.",
          "Oura: via cloud.ouraring.com → settings → export.",
          "Xiaomi: via privacy.mi.com.",
          "For any other: email privacy@[brand].com (they must provide a channel).",
        ],
      },
    },
    {
      type: "heading",
      level: 3,
      text: { it: "Diritto alla portabilità (art. 20)", en: "Right to portability (art. 20)" },
    },
    {
      type: "paragraph",
      text: {
        it: "Specifico per i dati che hai fornito (volontariamente o tramite uso del servizio). I dati derivati o aggregati dal titolare possono non essere inclusi. In formato 'strutturato, di uso comune e leggibile da dispositivo automatico', di solito CSV o JSON. Questa è la base legale che rende possibile cambiare ecosistema senza perdere lo storico.",
        en: "Specific to data you provided (voluntarily or via service use). Data derived or aggregated by the controller may not be included. In 'structured, commonly used and machine-readable format', usually CSV or JSON. This is the legal basis enabling ecosystem switches without losing history.",
      },
    },
    {
      type: "heading",
      level: 3,
      text: { it: "Diritto alla cancellazione (art. 17)", en: "Right to erasure (art. 17)" },
    },
    {
      type: "paragraph",
      text: {
        it: "Chiudendo l'account, i dati devono essere cancellati. Quasi tutti i brand mantengono backup operativi per 30–180 giorni dopo cancellazione (devono dichiararlo). Per dati anonimizzati e aggregati per ricerca/improvement la cancellazione può non essere obbligatoria.",
        en: "Closing the account, data must be deleted. Almost all brands keep operational backups for 30–180 days post-deletion (must be declared). For anonymized and aggregated data for research/improvement, deletion may not be mandatory.",
      },
    },
    {
      type: "heading",
      level: 3,
      text: { it: "Diritto di opposizione (art. 21)", en: "Right to object (art. 21)" },
    },
    {
      type: "paragraph",
      text: {
        it: "Per trattamenti basati su legittimo interesse (profilazione marketing, analytics aggregati non essenziali), puoi opporti in qualsiasi momento. Il titolare deve fermare il trattamento o dimostrare un interesse prevalente. Quasi sempre è la base legale dei programmi 'condividi dati anonimi per migliorare il servizio'.",
        en: "For processing based on legitimate interest (marketing profiling, non-essential aggregated analytics), you can object at any time. The controller must stop processing or prove an overriding interest. Almost always the legal basis for 'share anonymous data to improve service' programs.",
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: { it: "La vera priorità: il consenso bundled è la pratica più sleale", en: "The real priority: bundled consent is the most unfair practice" },
      body: {
        it: "Nella nostra lettura di decine di privacy policy wearable, il problema più diffuso non è dove stanno i server: è il consenso bundled. Accettare i termini di servizio di un'app dovrebbe essere separato dall'accedere al trattamento dei tuoi dati sanitari per analytics e ricerca. Quasi nessun brand lo fa in modo corretto. Se puoi fare una sola cosa, fai questa: dopo l'installazione, vai in Impostazioni → Privacy e revoca ogni consenso opzionale che non riguarda il funzionamento core del servizio.",
        en: "In our reading of dozens of wearable privacy policies, the most widespread problem is not where the servers are: it's bundled consent. Accepting a service's terms should be separate from consenting to your health data being processed for analytics and research. Almost no brand does this correctly. If you can do one thing, do this: after installation, go to Settings → Privacy and revoke every optional consent that doesn't relate to core service functionality.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Bandiere rosse nelle privacy policy", en: "Red flags in privacy policies" },
    },
    {
      type: "paragraph",
      text: {
        it: "Quando leggi la privacy policy di un brand wearable prima di acquistare, cerca queste parole-chiave. Sono indicatori di pratiche più o meno aggressive.",
        en: "When reading a wearable brand's privacy policy before buying, search these keywords. They're indicators of more or less aggressive practices.",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**'Condividiamo dati con partner di ricerca'** → consenso opt-in granulare? Sì = ok. Bundled in 'accetta tutto' = rosso.",
          "**'Dati aggregati e anonimizzati'** → l'anonimizzazione è reversibile in dataset multipli. Se possibile, opt-out.",
          "**'Per migliorare i nostri servizi e quelli dei partner'** → 'partner' è genericità sospetta.",
          "**'Personalizzazione pubblicitaria'** → per dati salute è proibito (Apple, Google/Fitbit dichiarano espressamente di non farlo grazie a impegni regolatori). Se trovi questa clausola in dati salute, cambia brand.",
          "**Server in Cina senza menzione GDPR** → per uso in Europa è quasi sempre un problema legale.",
        ],
        en: [
          "**'We share data with research partners'** → granular opt-in consent? Yes = ok. Bundled in 'accept all' = red.",
          "**'Aggregated and anonymized data'** → anonymization is reversible across multiple datasets. If possible, opt-out.",
          "**'To improve our services and those of our partners'** → 'partners' is suspicious vagueness.",
          "**'Advertising personalization'** → forbidden for health data (Apple, Google/Fitbit expressly declare they don't do it thanks to regulatory commitments). If you find this clause for health data, switch brand.",
          "**Servers in China without GDPR mention** → for European use almost always a legal problem.",
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
          "Frequenza cardiaca, sonno, ciclo mestruale e SpO₂ sono dati sanitari 'speciali' sotto GDPR art. 9: il consenso deve essere esplicito e granulare, non un generico 'accetta tutto'.",
          "I server di quasi tutti i brand non sono in Europa: Apple, Google/Fitbit, Garmin, Samsung trasferiscono dati verso gli USA con meccanismi SCC o DPF. Huawei e Xiaomi trasferiscono verso Asia con garanzie più deboli.",
          "Hai tre diritti pratici da esercitare subito: accesso (copia dei dati in 30 giorni, gratis), portabilità (formato CSV/JSON per cambiare ecosistema), cancellazione (chiudendo l'account).",
          "Bandiera rossa nelle privacy policy: 'condividiamo con partner di ricerca' bundled in un consenso unico, o 'personalizzazione pubblicitaria' per dati salute.",
          "Health Connect è il setup Android più privacy-friendly disponibile: i dati restano on-device, ogni app chiede permesso per tipo di dato.",
        ],
        en: [
          "Heart rate, sleep, menstrual cycle and SpO₂ are 'special' health data under GDPR art. 9: consent must be explicit and granular, not a generic 'accept all'.",
          "Almost no major brand has servers in Europe: Apple, Google/Fitbit, Garmin, Samsung transfer data to the USA via SCC or DPF mechanisms. Huawei and Xiaomi transfer to Asia with weaker guarantees.",
          "You have three practical rights to exercise now: access (data copy within 30 days, free), portability (CSV/JSON format to switch ecosystems), erasure (by closing your account).",
          "Red flag in privacy policies: 'we share with research partners' bundled in a single consent, or 'advertising personalization' for health data.",
          "Health Connect is the most privacy-friendly Android setup available: data stays on-device, every app must request permission per data type.",
        ],
      },
    },
    {
      type: "cta",
      title: {
        it: "Vuoi una soluzione che minimizza la pipeline dati?",
        en: "Want a solution minimizing the data pipeline?",
      },
      body: {
        it: "FitMesh Sync legge da Health Connect (on-device) e archivia su backend Supabase ospitato in UE (Francoforte). Nessun ad-tech, nessun reseller di dati, accesso e cancellazione a un click.",
        en: "FitMesh Sync reads from Health Connect (on-device) and stores on a Supabase backend hosted in the EU (Frankfurt). No ad-tech, no data reseller, one-click access and deletion.",
      },
      ctaLabel: { it: "Leggi la nostra privacy", en: "Read our privacy" },
      ctaHref: { it: "/it/privacy", en: "/en/privacy" },
    },
  ],
  faq: [
    {
      q: {
        it: "Posso citare un brand in giudizio se viola il GDPR?",
        en: "Can I sue a brand if it violates GDPR?",
      },
      a: {
        it: "In Europa la via standard è il reclamo al Garante nazionale della protezione dei dati (in Italia: GPDP, www.garanteprivacy.it). Gratuito, il Garante può aprire istruttoria e sanzionare. L'azione civile diretta è possibile ma costosa; conviene se hai subito un danno concreto e quantificabile (es. data breach con identità rubata).",
        en: "In Europe the standard route is a complaint to the national Data Protection Authority (Italy: GPDP, www.garanteprivacy.it). Free, the authority can open an investigation and fine. Direct civil action is possible but costly; worth it if you suffered concrete quantifiable damage (e.g. data breach with identity theft).",
      },
    },
    {
      q: {
        it: "Health Connect è sicuro per dati sanitari?",
        en: "Is Health Connect safe for health data?",
      },
      a: {
        it: "Strutturalmente sì, è il setup più privacy-friendly disponibile su Android. I dati restano sul telefono, ogni app deve chiedere permesso esplicito per tipo di dato, c'è log di accesso. Resta importante valutare quali app autorizzi: una volta che un'app legge da HC, può poi caricare quei dati altrove (è il caso di MyFitnessPal o app coaching che mandano dati al loro cloud).",
        en: "Structurally yes, it's the most privacy-friendly setup available on Android. Data stays on the phone, every app must request explicit permission per data type, access is logged. Still important to evaluate which apps you authorize: once an app reads from HC, it can then upload data elsewhere (case of MyFitnessPal or coaching apps sending data to their cloud).",
      },
    },
    {
      q: {
        it: "L'app FitMesh Sync è conforme al GDPR?",
        en: "Is the FitMesh Sync app GDPR-compliant?",
      },
      a: {
        it: "Sì. Privacy policy esplicita, server backend ospitati su Supabase Frankfurt (UE), consenso granulare in app, cancellazione dati one-click da impostazioni, nessuna condivisione con terze parti per ad-tech, nessun tracker analytics intrusivo. Architettura privacy-by-design.",
        en: "Yes. Explicit privacy policy, backend on Supabase Frankfurt (EU), granular in-app consent, one-click data deletion from settings, no third-party ad-tech sharing, no intrusive analytics trackers. Privacy-by-design architecture.",
      },
    },
  ],
  related: [
    "guida-sync-wearable-2026",
    "scegliere-smartwatch-dati-2026",
    "esportare-dati-fitbit-google",
    "backup-galaxy-watch-pc",
  ],
  brandsMentioned: ["Apple", "Google", "Fitbit", "Samsung", "Garmin", "Polar", "Withings", "Oura", "Xiaomi", "Huawei"],
  ldType: "BlogPosting",
};
