import type { BlogPost } from "../types";

export const post: BlogPost = {
  slug: "backup-galaxy-watch-pc",
  category: "guides",
  publishedAt: "2026-05-21",
  updatedAt: "2026-05-21",
  readMinutes: 9,
  primaryKeyword: {
    it: "backup galaxy watch pc",
    en: "galaxy watch backup pc",
  },
  secondaryKeywords: {
    it: [
      "scaricare dati samsung health",
      "esportare dati galaxy watch",
      "samsung health backup",
      "backup galaxy watch senza samsung cloud",
    ],
    en: [
      "download samsung health data",
      "export galaxy watch data",
      "samsung health backup",
      "galaxy watch backup without samsung cloud",
    ],
  },
  metaDescription: {
    it: "Come fare backup dei dati Galaxy Watch su PC senza Samsung Cloud: esportazione Samsung Health, GDPR data request, dashboard alternative. Guida passo passo 2026.",
    en: "How to back up Galaxy Watch data on PC without Samsung Cloud: Samsung Health export, GDPR data request, alternative dashboards. Step-by-step 2026 guide.",
  },
  hero: {
    kicker: { it: "Guida pratica", en: "Practical guide" },
    title: {
      it: "Come fare backup dati Galaxy Watch su PC senza Samsung Cloud",
      en: "How to back up Galaxy Watch data on PC without Samsung Cloud",
    },
    subtitle: {
      it: "Quattro vie reali per portare passi, BPM, sonno e allenamenti del Galaxy Watch fuori da Samsung Health. Pro e contro di ognuna.",
      en: "Four real ways to get steps, HR, sleep and workouts off your Galaxy Watch and outside Samsung Health. Pros and cons of each.",
    },
  },
  body: [
    {
      type: "paragraph",
      text: {
        it: "Vuoi una copia dei dati del tuo Galaxy Watch sul computer. Non ti fidi del solo cloud Samsung, o stai cambiando ecosistema, o hai semplicemente bisogno di analizzare i tuoi BPM in Excel. Le opzioni reali sono quattro, e nessuna è 'un click'. Ti spieghiamo cosa funziona, cosa è scomodo, e quando vale ognuna.",
        en: "You want a copy of your Galaxy Watch data on your computer. You don't trust Samsung cloud alone, or you're switching ecosystems, or you simply need to analyze your HR in Excel. There are four real options, and none is 'one click'. We explain what works, what's clunky, and when each is worth it.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Opzione 1: esportazione interna di Samsung Health", en: "Option 1: Samsung Health's internal export" },
    },
    {
      type: "paragraph",
      text: {
        it: "Samsung Health (Android) ha una funzione di esportazione integrata che genera un pacchetto di file con tutti i tuoi dati raw. Non è promossa nei tutorial, ma è lì da anni.",
        en: "Samsung Health (Android) has a built-in export function generating a package of files with all your raw data. It's not promoted in tutorials, but it's been there for years.",
      },
    },
    {
      type: "list",
      ordered: true,
      items: {
        it: [
          "Apri Samsung Health sul telefono.",
          "Tocca l'icona ☰ menu in alto a sinistra → Impostazioni.",
          "Scorri fino a 'Scarica dati personali' (in inglese 'Download personal data').",
          "Conferma con password Samsung Account.",
          "Attendi (può richiedere 1–24 ore se hai anni di dati). Riceverai un ZIP via email.",
        ],
        en: [
          "Open Samsung Health on the phone.",
          "Tap ☰ menu top-left → Settings.",
          "Scroll to 'Download personal data'.",
          "Confirm with Samsung Account password.",
          "Wait (can take 1–24 hours if you have years of data). You'll receive a ZIP via email.",
        ],
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Il pacchetto contiene file CSV per ogni tipo di dato (steps_*.csv, heart_rate_*.csv, sleep_*.csv, exercise_*.csv, etc.) più file binari per dati ad alta frequenza come HR continuo durante allenamenti. È completo ma verboso. Per analizzare in Excel/Numbers basta importare i CSV; per visualizzazioni più sofisticate puoi usare Python pandas o R.",
        en: "The package contains CSV files for each data type (steps_*.csv, heart_rate_*.csv, sleep_*.csv, exercise_*.csv, etc.) plus binary files for high-frequency data like continuous HR during workouts. It's complete but verbose. To analyze in Excel/Numbers just import the CSVs; for more sophisticated visualizations use Python pandas or R.",
      },
    },
    {
      type: "callout",
      variant: "tip",
      title: { it: "Pro/contro Opzione 1", en: "Pros/cons Option 1" },
      body: {
        it: "**Pro**: completo, gratuito, formato standard. **Contro**: manuale (devi ripeterlo periodicamente), nessuna automazione, nessuna interfaccia di analisi inclusa.",
        en: "**Pros**: complete, free, standard format. **Cons**: manual (must repeat periodically), no automation, no analysis UI included.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Opzione 2: richiesta GDPR diritto di accesso", en: "Option 2: GDPR right-of-access request" },
    },
    {
      type: "paragraph",
      text: {
        it: "Se sei in UE, puoi scrivere a Samsung chiedendo formalmente tutti i dati raccolti su di te (art. 15 e 20 GDPR). Per dati salute il punto di contatto è privacy.eu@samsung.com (o il modulo dedicato su privacy.samsung.com/it/privacy-rights). Hanno 30 giorni per rispondere, gratuitamente. Il dataset che ricevi è tipicamente più ampio di quello dell'esportazione interna (include anche metadati, log di accesso, info account).",
        en: "If you're in the EU, you can formally write to Samsung asking for all data collected about you (GDPR art. 15 and 20). For health data the contact is privacy.eu@samsung.com (or the dedicated form at privacy.samsung.com/en/privacy-rights). They have 30 days to respond, free of charge. The dataset you receive is typically broader than the internal export (includes metadata, access logs, account info).",
      },
    },
    {
      type: "callout",
      variant: "info",
      title: { it: "Quando vale la richiesta GDPR", en: "When the GDPR request is worth it" },
      body: {
        it: "Soprattutto se stai per chiudere l'account Samsung e vuoi una copia completa per archivio. Per backup ricorrente è scomoda (un mese di attesa). Per controllo totale è insostituibile.",
        en: "Especially if you're about to close your Samsung account and want a full copy for archive. For recurring backup it's clunky (a month of waiting). For total control it's irreplaceable.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Opzione 3: leggere via Health Connect su app terza", en: "Option 3: read via Health Connect on a third-party app" },
    },
    {
      type: "paragraph",
      text: {
        it: "Dal 2024 Samsung Health scrive su Health Connect, che è la API ufficiale Android. Puoi installare un'app terza che legga via Health Connect ed esponga i dati nel formato che vuoi: dashboard web, file JSON, sync con altri ecosistemi. È il modo più automatizzato.",
        en: "Since 2024 Samsung Health writes to Health Connect, Android's official API. You can install a third-party app reading via Health Connect and exposing data in the format you want: web dashboard, JSON files, sync with other ecosystems. It's the most automated way.",
      },
    },
    {
      type: "list",
      items: {
        it: [
          "**Per dashboard web**: FitMesh Sync legge da Health Connect e mostra tutto su una web app accessibile da PC.",
          "**Per export tecnico**: app come Health Connect Toolbox (open source) producono dump JSON manuali.",
          "**Per analytics avanzati**: app come Welltory o Bearable leggono HC e fanno coaching/journaling.",
        ],
        en: [
          "**For web dashboard**: FitMesh Sync reads from Health Connect and shows everything on a PC-accessible web app.",
          "**For technical export**: apps like Health Connect Toolbox (open source) produce manual JSON dumps.",
          "**For advanced analytics**: apps like Welltory or Bearable read HC and provide coaching/journaling.",
        ],
      },
    },
    {
      type: "paragraph",
      text: {
        it: "Vincolo: questa via funziona per dati che Samsung Health scrive su Health Connect — quindi passi, BPM, sonno (totale e fasi base), calorie, distanza, allenamenti. Per dati proprietari Samsung come Body Composition o Stress Score continuo serve sempre l'export interno di Samsung Health.",
        en: "Caveat: this path works for data Samsung Health writes to Health Connect — so steps, HR, sleep (total and basic stages), calories, distance, workouts. For Samsung-proprietary data like Body Composition or continuous Stress Score you'll always need Samsung Health's internal export.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Opzione 4: ADB backup (avanzato)", en: "Option 4: ADB backup (advanced)" },
    },
    {
      type: "paragraph",
      text: {
        it: "Per i più tecnici: i dati Samsung Health risiedono sul telefono in un database SQLite. Con un cavo USB, ADB attivato in opzioni sviluppatore, e un tool come adb backup oppure root puoi estrarre il file e leggerlo direttamente. Sconsigliato a chi non sa cosa significa 'developer options' — è facile fare danni e c'è rischio di violare i ToS.",
        en: "For the more technical: Samsung Health data lives on the phone in a SQLite database. With a USB cable, ADB enabled in developer options, and a tool like adb backup or root you can extract the file and read it directly. Not recommended if you don't know what 'developer options' means — easy to break things and risks violating ToS.",
      },
    },
    {
      type: "heading",
      level: 2,
      text: { it: "Tabella riepilogativa", en: "Summary table" },
    },
    {
      type: "table",
      headers: {
        it: ["Opzione", "Difficoltà", "Completezza", "Automazione"],
        en: ["Option", "Difficulty", "Completeness", "Automation"],
      },
      rows: [
        {
          it: ["Export Samsung Health", "Bassa", "Alta", "No"],
          en: ["Samsung Health export", "Low", "High", "No"],
        },
        {
          it: ["GDPR request", "Bassa", "Massima", "No (30gg)"],
          en: ["GDPR request", "Low", "Maximum", "No (30 days)"],
        },
        {
          it: ["Health Connect + app terza", "Bassa", "Media", "Sì"],
          en: ["Health Connect + 3rd party", "Low", "Medium", "Yes"],
        },
        {
          it: ["ADB / SQLite", "Alta", "Massima", "Con script"],
          en: ["ADB / SQLite", "High", "Maximum", "With scripts"],
        },
      ],
    },
    {
      type: "cta",
      title: {
        it: "Cerchi una dashboard web pronta per i dati Galaxy Watch?",
        en: "Looking for a ready web dashboard for Galaxy Watch data?",
      },
      body: {
        it: "FitMesh Sync legge da Samsung Health via Health Connect e mostra passi, BPM, sonno e allenamenti su una dashboard web accessibile da qualsiasi browser. Setup di 30 secondi sul telefono.",
        en: "FitMesh Sync reads from Samsung Health via Health Connect and shows steps, HR, sleep and workouts on a browser-accessible web dashboard. 30-second phone setup.",
      },
      ctaLabel: { it: "Vedi Galaxy Watch su FitMesh →", en: "See Galaxy Watch on FitMesh →" },
      ctaHref: { it: "/it/sync/galaxy-watch", en: "/en/sync/galaxy-watch" },
    },
  ],
  faq: [
    {
      q: {
        it: "L'esportazione include lo storico completo?",
        en: "Does the export include the full history?",
      },
      a: {
        it: "Sì: l'export Samsung Health interno include tutti i dati associati al tuo account, anche pluriennali. Se hai cambiato account in passato, lo storico legato al vecchio account non è incluso e va recuperato separatamente.",
        en: "Yes: the Samsung Health internal export includes all data linked to your account, multi-year too. If you changed account in the past, the history tied to the old account isn't included and must be recovered separately.",
      },
    },
    {
      q: {
        it: "Posso fare il backup senza autenticarmi con Samsung Account?",
        en: "Can I back up without authenticating with Samsung Account?",
      },
      a: {
        it: "Per l'export interno di Samsung Health la password è richiesta. Per la via Health Connect + app terza no — basta il permesso Android. È l'unica strada che non passa dall'account Samsung.",
        en: "For Samsung Health's internal export the password is required. For the Health Connect + third-party app path no — Android permission is enough. It's the only route bypassing the Samsung account.",
      },
    },
    {
      q: {
        it: "I file esportati funzionano in Excel?",
        en: "Do exported files work in Excel?",
      },
      a: {
        it: "Sì, i CSV sono compatibili con Excel/Numbers/Google Sheets. Apri il file, scegli virgola come separatore se richiesto. Per file molto grandi (>1M righe per dati come HR continuo annuali) conviene usare strumenti specifici (Python pandas, R, DuckDB).",
        en: "Yes, CSVs are compatible with Excel/Numbers/Google Sheets. Open the file, choose comma as separator if asked. For very large files (>1M rows for things like annual continuous HR) use specific tools (Python pandas, R, DuckDB).",
      },
    },
  ],
  related: [
    "guida-sync-wearable-2026",
    "health-connect-vs-samsung-health",
    "vedere-dati-wearable-browser-pc",
  ],
  brandsMentioned: ["Samsung", "Google"],
  ldType: "BlogPosting",
};
