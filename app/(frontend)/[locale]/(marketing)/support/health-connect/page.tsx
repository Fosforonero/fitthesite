import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/product-facts";
import { schemaLanguage } from "@/lib/seo/schema-language";

export const dynamic = "force-static";

const SUPPORTED_LOCALES = ["it", "en"] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function generateStaticParams() {
  return [{ locale: "it" }, { locale: "en" }];
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
    notFound();
  }
  const lc = locale as SupportedLocale;

  const title = lc === "it"
    ? "Come collegare Connessione Salute (Health Connect) a FitMesh Sync: guida passo-passo"
    : "How to connect Health Connect to FitMesh Sync on Android: step-by-step guide";

  const description = lc === "it"
    ? "Istruzioni con schermate autentiche per Android: trovare Connessione Salute, verificare l'app sorgente, configurare i permessi di FitMesh Sync e avviare la prima sincronizzazione."
    : "Step-by-step instructions with verified Android screenshots: find Health Connect, check your companion app, configure FitMesh Sync permissions, and start your first sync.";

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${lc}/support/health-connect`,
      languages: {
        it: `${SITE_URL}/it/support/health-connect`,
        en: `${SITE_URL}/en/support/health-connect`,
      },
    },
  };
}

interface StepItem {
  id: number;
  title: string;
  action: string;
  expected: string;
  troubleshoot: string;
  imageSrc: string;
  imageAlt: string;
  caption: string;
  statusBadge?: string;
}

const STEPS_IT: StepItem[] = [
  {
    id: 1,
    title: "1. Trova e apri Connessione Salute",
    action: "Apri le Impostazioni di Android, tocca Sicurezza e privacy, scorri fino alla sezione Privacy e tocca Connessione Salute.",
    expected: "Si apre la schermata principale di Connessione Salute con la voce «Gestisci l'accesso delle app ai dati sulla salute».",
    troubleshoot: "Su Android 14 o versioni successive Connessione Salute è integrata nel sistema operativo. Su Android 9-13 è necessario installare l'app Connessione Salute dal Google Play Store. Sugli smartphone Samsung Galaxy, il percorso può trovarsi anche in Impostazioni > Sicurezza e privacy > Connessione Salute oppure direttamente nelle impostazioni di Samsung Health.",
    imageSrc: "/support/health-connect/01-impostazioni-connessione-salute.webp",
    imageAlt: "Schermata Impostazioni Android 14 con voce Connessione Salute nella sezione Privacy",
    caption: "Ambiente: Google Pixel 6 · Android 14 (API 34). Percorso di sistema: Impostazioni > Sicurezza e privacy > Privacy > Connessione Salute.",
  },
  {
    id: 2,
    title: "2. Accedi alla gestione delle autorizzazioni app",
    action: "Nella schermata principale di Connessione Salute, tocca Autorizzazioni app per consultare le applicazioni che richiedono accesso ai dati sanitari.",
    expected: "Visualizzi il riepilogo delle applicazioni, suddivise tra app con accesso consentito e app con accesso non consentito.",
    troubleshoot: "Se non vedi alcuna applicazione nell'elenco, verifica di aver già installato sul dispositivo sia l'app del tuo dispositivo indossabile sia FitMesh Sync.",
    imageSrc: "/support/health-connect/02-connessione-salute-autorizzazioni-app.webp",
    imageAlt: "Schermata principale di Connessione Salute con la voce Autorizzazioni app",
    caption: "Ambiente: Google Pixel 6 · Android 14 (API 34). Schermata iniziale di Connessione Salute con conteggio delle app collegate.",
  },
  {
    id: 3,
    title: "3. Verifica che l'app del tuo wearable scriva i dati",
    action: "Apri l'app ufficiale del tuo smartwatch o fitness tracker (es. Samsung Health, Garmin Connect, Zepp, Withings, Oura) e assicurati che la sincronizzazione verso Connessione Salute sia attiva nelle sue impostazioni. In Connessione Salute puoi controllare le categorie in Dati e accesso > Sfoglia i dati.",
    expected: "L'applicazione del produttore scrive le metriche supportate nel repository condiviso. Nota: le metriche disponibili dipendono dall'app sorgente e dal dispositivo; non tutti i produttori scrivono l'intero insieme di parametri (passi, frequenza cardiaca, sonno, calorie, distanza).",
    troubleshoot: "Se una categoria mostra «Nessun dato», significa che la tua sorgente non ha ancora registrato letture in Connessione Salute per la giornata. Apri l'app del produttore e forza una sincronizzazione dall'orologio al telefono.",
    imageSrc: "/support/health-connect/03-connessione-salute-categorie-dati.webp",
    imageAlt: "Schermata Connessione Salute Sfoglia i dati con le categorie che mostrano Nessun dato",
    caption: "Ambiente: Google Pixel 6 · Android 14 (API 34). Schermata Connessione Salute (Sfoglia i dati) con «Nessun dato» prima del collegamento di una sorgente. La configurazione dei permessi di scrittura varia in base all'app del produttore ed è dichiarata non verificata a runtime su questo banco sintetico privo di account o dispositivi fisici di terze parti.",
    statusBadge: "Non verificato a runtime su banco sintetico",
  },
  {
    id: 4,
    title: "4. Seleziona FitMesh Sync dall'elenco app",
    action: "Torna alla schermata Autorizzazioni app e seleziona FitMesh Sync, presente inizialmente nella sezione Accesso non consentito.",
    expected: "Si apre la schermata specifica per configurare i permessi concessi a FitMesh Sync.",
    troubleshoot: "Se FitMesh Sync non compare nell'elenco, apri l'app FitMesh Sync sul telefono, completa l'accesso con il tuo account ed esegui il primo avvio.",
    imageSrc: "/support/health-connect/04-elenco-app-fitmesh.webp",
    imageAlt: "Elenco delle applicazioni in Connessione Salute con FitMesh Sync sotto Accesso non consentito",
    caption: "Ambiente: Google Pixel 6 · Android 14 (API 34). Elenco applicazioni con FitMesh Sync nello stato iniziale di accesso non ancora autorizzato.",
  },
  {
    id: 5,
    title: "5. Configura le autorizzazioni di lettura per FitMesh Sync",
    action: "Verifica e abilita le autorizzazioni di lettura per le metriche che desideri sincronizzare (es. Passi, Battito cardiaco a riposo, Sonno, Calorie totali bruciate, Distanza, Esercizio fisico), oppure attiva Consenti tutte.",
    expected: "Gli interruttori delle metriche selezionate passano sullo stato attivo. Per il percorso di sincronizzazione descritto in questa guida, FitMesh Sync opera leggendo i dati registrati in Connessione Salute. (I permessi di scrittura dichiarati dall'app nel manifest servono solo per funzioni opzionali di write-back).",
    troubleshoot: "Se lasci disattivata una metrica specifica (come il sonno o la frequenza cardiaca), FitMesh Sync non potrà leggere quel dato e le card corrispondenti nella dashboard rimarranno prive di registrazioni.",
    imageSrc: "/support/health-connect/05-permessi-lettura-fitmesh.webp",
    imageAlt: "Schermata di autorizzazione di FitMesh Sync in Connessione Salute con opzione Consenti tutte e permessi di lettura attivi",
    caption: "Ambiente: Google Pixel 6 · Android 14 (API 34) · FitMesh Sync v3.9.9+190. Schermata delle autorizzazioni di lettura con selettori attivi.",
  },
  {
    id: 6,
    title: "6. Apri FitMesh Sync e avvia un tentativo di sincronizzazione",
    action: "Apri l'app FitMesh Sync. Nella schermata principale individua la card Sincronizzazione e premi il pulsante Sincronizza ora per avviare una richiesta di lettura a Connessione Salute.",
    expected: "L'app interroga le API locali di Connessione Salute per importare le metriche presenti. Il pulsante si disabilita temporaneamente durante l'operazione.",
    troubleshoot: "Se compare il messaggio «Attenzione: Nessun wearable rilevato», significa che il ciclo di lettura non ha reperito dati validi. Questa condizione può dipendere da più cause: l'app del tuo orologio non ha ancora scritto dati per la data odierna in Connessione Salute, i permessi di lettura pertinenti non sono attivi, oppure si è verificato un errore temporaneo di lettura delle API.",
    imageSrc: "/support/health-connect/06-dashboard-sincronizza-ora.webp",
    imageAlt: "Dashboard di FitMesh Sync con account dimostrativo e avviso Nessun wearable rilevato",
    caption: "Ambiente: Google Pixel 6 · Android 14 (API 34) · FitMesh Sync v3.9.9+190 (account dimostrativo qa-demo@internal.invalid). I valori numerici visibili (es. 7.450 passi) sono dati sintetici precaricati dall'ambiente demo e non costituiscono un'importazione da Connessione Salute. L'avviso «Nessun wearable rilevato» indica l'assenza di nuove registrazioni disponibili.",
  },
  {
    id: 7,
    title: "7. Controlla lo stato nel Centro Sincronizzazione (Diagnostica)",
    action: "Nella card Sincronizzazione tocca il pulsante Diagnostica per visualizzare la schermata dettagliata del Centro Sincronizzazione.",
    expected: "Visualizzi il Centro Sincronizzazione con il dettaglio metrica per metrica.",
    troubleshoot: "Le diciture «Mai sincronizzato» e «Nessuna sorgente» descrivono uno stato di configurazione iniziale incompleta (nessun dato è stato ancora memorizzato in Connessione Salute), non un esito positivo. Toccando ciascuna metrica puoi verificare se il dato manca alla sorgente o se l'autorizzazione di lettura corrispondente è disattivata.",
    imageSrc: "/support/health-connect/07-centro-sincronizzazione-diagnostica.webp",
    imageAlt: "Schermata Centro Sincronizzazione con diciture Mai sincronizzato e Nessuna sorgente per le metriche",
    caption: "Ambiente: Google Pixel 6 · Android 14 (API 34) · FitMesh Sync v3.9.9+190. Centro Sincronizzazione: «Mai sincronizzato» e «Nessuna sorgente» rappresentano uno stato di configurazione iniziale non ancora completata, non una sincronizzazione avvenuta con successo.",
  },
  {
    id: 8,
    title: "8. (Facoltativo) Gestione della batteria e aggiornamento in background",
    action: "Nelle Impostazioni Android > App > FitMesh Sync > Utilizzo della batteria per l'app puoi selezionare Senza limitazioni se desideri ridurre i vincoli di risparmio energetico del sistema operativo.",
    expected: "Il selettore dell'utilizzo batteria si sposta su «Senza limitazioni».",
    troubleshoot: "Questo passaggio è facoltativo. L'impostazione della batteria non garantisce da sola la sincronizzazione automatica: l'aggiornamento a schermo spento dipende anche dall'autorizzazione alla lettura in background in Connessione Salute, dalla versione di Health Connect installata e dalle policy di Doze del produttore del telefono. Un tentativo di sincronizzazione manuale con «Sincronizza ora» può essere avviato in qualsiasi momento anche con il profilo «Ottimizzato».",
    imageSrc: "/support/health-connect/08-impostazioni-batteria-background.webp",
    imageAlt: "Schermata Impostazioni Android Utilizzo della batteria per l'app con opzione Senza limitazioni",
    caption: "Ambiente: Google Pixel 6 · Android 14 (API 34). Schermata Utilizzo della batteria per l'app con l'opzione «Senza limitazioni» selezionata.",
  },
];

const STEPS_EN: StepItem[] = [
  {
    id: 1,
    title: "1. Find and open Health Connect",
    action: "Open Android Settings, tap Security & privacy, scroll down to Privacy, and tap Health Connect («Connessione Salute»).",
    expected: "The Health Connect main screen opens showing «Manage app access to health data» («Gestisci l'accesso delle app ai dati sulla salute»).",
    troubleshoot: "On Android 14 or newer, Health Connect is built into system settings. On Android 9-13, install the standalone Health Connect app from Google Play Store. On Samsung Galaxy smartphones, this menu may also appear under Settings > Security & privacy > Health Connect or inside Samsung Health settings.",
    imageSrc: "/support/health-connect/01-impostazioni-connessione-salute.webp",
    imageAlt: "Android 14 Settings screen showing Health Connect under Privacy section",
    caption: "Environment: Google Pixel 6 · Android 14 (API 34). System path: Settings > Security & privacy > Privacy > Health Connect. (Reference device running Italian system locale).",
  },
  {
    id: 2,
    title: "2. Open app permissions",
    action: "On the Health Connect home screen, tap App permissions («Autorizzazioni app») to inspect which applications request health data access.",
    expected: "You see the list of applications, split into allowed and not allowed categories.",
    troubleshoot: "If no apps are listed, verify that both your wearable companion app and FitMesh Sync are installed on this phone.",
    imageSrc: "/support/health-connect/02-connessione-salute-autorizzazioni-app.webp",
    imageAlt: "Health Connect home screen displaying App permissions section",
    caption: "Environment: Google Pixel 6 · Android 14 (API 34). Health Connect home screen displaying connected app count. (Italian interface: «Autorizzazioni app»).",
  },
  {
    id: 3,
    title: "3. Verify your wearable companion app writes health data",
    action: "Open your smartwatch or tracker companion app (e.g., Samsung Health, Garmin Connect, Zepp, Withings, Oura) and ensure sync to Health Connect is turned on in its settings. In Health Connect, you can inspect categories under Data & access > Browse data («Dati e accesso > Sfoglia i dati»).",
    expected: "Your companion app writes supported metrics to the shared repository. Note: available metrics depend on the source app and hardware model; not all vendors support or write the full set of metrics (steps, heart rate, sleep, calories, distance).",
    troubleshoot: "If a category shows «Nessun dato» (No data), your wearable source has not recorded any readings in Health Connect for today yet. Open your companion app and trigger a sync from watch to phone.",
    imageSrc: "/support/health-connect/03-connessione-salute-categorie-dati.webp",
    imageAlt: "Health Connect Browse data screen showing categories with No data state",
    caption: "Environment: Google Pixel 6 · Android 14 (API 34). Health Connect Browse data screen showing «Nessun dato» (No data) before a companion app writes records. Companion write configuration varies by vendor and is declared unverified at runtime on this synthetic test environment without third-party accounts or hardware.",
    statusBadge: "Unverified at runtime on synthetic bench",
  },
  {
    id: 4,
    title: "4. Select FitMesh Sync from the app list",
    action: "Return to the App permissions screen and select FitMesh Sync, initially located under the Not allowed section («Accesso non consentito»).",
    expected: "The dedicated permission configuration screen for FitMesh Sync opens.",
    troubleshoot: "If FitMesh Sync is not visible in the list, open the FitMesh Sync app, sign in to your account, and complete initial launch setup.",
    imageSrc: "/support/health-connect/04-elenco-app-fitmesh.webp",
    imageAlt: "Health Connect app permissions list showing FitMesh Sync under Not allowed section",
    caption: "Environment: Google Pixel 6 · Android 14 (API 34). App permissions list showing FitMesh Sync in the initial unauthorized state. (Italian interface: «Accesso non consentito»).",
  },
  {
    id: 5,
    title: "5. Configure read permissions for FitMesh Sync",
    action: "Review and toggle on the read permissions for the metrics you wish to track (e.g., Steps, Resting heart rate, Sleep, Total calories burned, Distance, Exercise), or turn on Allow all («Consenti tutte»).",
    expected: "The selected metric toggles turn on. For the smartwatch reading path described in this guide, FitMesh Sync operates by reading records stored in Health Connect. (Optional write permissions declared in the manifest are only used for opt-in write-back features).",
    troubleshoot: "If you leave a specific metric disabled (such as sleep or heart rate), FitMesh Sync cannot read that data point and its dashboard card will stay empty.",
    imageSrc: "/support/health-connect/05-permessi-lettura-fitmesh.webp",
    imageAlt: "FitMesh Sync permissions screen in Health Connect with Allow all and read permissions toggled on",
    caption: "Environment: Google Pixel 6 · Android 14 (API 34) · FitMesh Sync v3.9.9+190. Read permissions screen with active toggles. (Italian interface: «Consenti tutte» / «Autorizzazioni di lettura»).",
  },
  {
    id: 6,
    title: "6. Open FitMesh Sync and start a sync attempt",
    action: "Open the FitMesh Sync app. On the home dashboard, locate the Synchronization card and tap the Sync now («Sincronizza ora») button to request data from Health Connect.",
    expected: "The app queries the local Health Connect APIs to import available metrics. The button temporarily disables during the operation.",
    troubleshoot: "If the warning «No wearable detected» («Attenzione: Nessun wearable rilevato») appears, the sync cycle found no valid new records. This can stem from multiple causes: your companion app has not written records for today yet, relevant read permissions are disabled, or a transient API read error occurred.",
    imageSrc: "/support/health-connect/06-dashboard-sincronizza-ora.webp",
    imageAlt: "FitMesh Sync dashboard with demo account and No wearable detected warning banner",
    caption: "Environment: Google Pixel 6 · Android 14 (API 34) · FitMesh Sync v3.9.9+190 (demo account qa-demo@internal.invalid). Displayed numbers (e.g., 7,450 steps) are pre-loaded synthetic fixture data, not an import from Health Connect. The «Nessun wearable rilevato» notice indicates no new records were found.",
  },
  {
    id: 7,
    title: "7. Inspect status in the Sync Center (Diagnostics)",
    action: "In the Synchronization card, tap Diagnostics («Diagnostica») to open the detailed Sync Center screen («Centro Sincronizzazione»).",
    expected: "You see the Sync Center with metric-by-metric source information.",
    troubleshoot: "The labels «Never synced» («Mai sincronizzato») and «No source» («Nessuna sorgente») describe an incomplete initial setup state (no data has been written to Health Connect yet), not a successful sync. Tapping each metric clarifies whether data is missing at the source or read permissions are turned off.",
    imageSrc: "/support/health-connect/07-centro-sincronizzazione-diagnostica.webp",
    imageAlt: "Sync Center screen showing Never synced and No source labels for health metrics",
    caption: "Environment: Google Pixel 6 · Android 14 (API 34) · FitMesh Sync v3.9.9+190. Sync Center: «Mai sincronizzato» (Never synced) and «Nessuna sorgente» (No source) represent an incomplete initial configuration state, not a successful sync outcome.",
  },
  {
    id: 8,
    title: "8. (Optional) Battery management and background syncing",
    action: "Under Android Settings > Apps > FitMesh Sync > App battery usage, you may select Unrestricted («Senza limitazioni») to reduce system battery saver constraints.",
    expected: "The battery usage radio button switches to «Unrestricted» («Senza limitazioni»).",
    troubleshoot: "This step is optional. Battery settings alone do not guarantee automatic background sync: background execution also depends on the Health Connect background read permission, the Health Connect platform version, and vendor Doze policies. A manual sync attempt with «Sincronizza ora» can always be initiated at any time even under the default «Optimized» profile.",
    imageSrc: "/support/health-connect/08-impostazioni-batteria-background.webp",
    imageAlt: "Android App battery usage settings screen with Unrestricted option selected",
    caption: "Environment: Google Pixel 6 · Android 14 (API 34). App battery usage screen with the «Senza limitazioni» (Unrestricted) option selected.",
  },
];

export default async function HealthConnectGuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
    notFound();
  }
  const lc = locale as SupportedLocale;

  const isIt = lc === "it";
  const steps = isIt ? STEPS_IT : STEPS_EN;

  const pageTitle = isIt
    ? "Configurazione Android: Connessione Salute e prima sincronizzazione"
    : "Android Setup: Health Connect and first sync";

  const pageSubtitle = isIt
    ? "Guida dettagliata con schermate autentiche per configurare Connessione Salute, verificare l'app del tuo orologio e avviare la sincronizzazione con FitMesh Sync."
    : "Detailed guide with verified screenshots to configure Health Connect, verify your wearable companion app, and start syncing with FitMesh Sync.";

  const crumbSupport = isIt ? "Supporto" : "Support";
  const crumbCurrent = isIt ? "Guida Connessione Salute" : "Health Connect Guide";

  // Structured Data (HowTo without arbitrary totalTime)
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: isIt
      ? "Come configurare Connessione Salute con FitMesh Sync su Android"
      : "How to set up Health Connect with FitMesh Sync on Android",
    description: pageSubtitle,
    inLanguage: schemaLanguage(lc),
    step: steps.map((s, idx) => ({
      "@type": "HowToStep",
      position: idx + 1,
      name: s.title,
      text: `${s.action} ${s.expected}`,
      image: `${SITE_URL}${s.imageSrc}`,
      url: `${SITE_URL}/${lc}/support/health-connect#passo-${s.id}`,
    })),
  };

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <Breadcrumbs
        items={[
          { name: crumbSupport, path: `/${lc}/support` },
          { name: crumbCurrent, path: `/${lc}/support/health-connect` },
        ]}
        locale={lc}
      />
      <JsonLd data={howToJsonLd} />

      <header className="mb-12">
        <p className="text-[10px] uppercase tracking-[0.22em] text-brand-aqua font-semibold">
          {isIt ? "Guida passo-passo Android" : "Android step-by-step guide"}
        </p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-text-primary">
          {pageTitle}
        </h1>
        <p className="mt-3 text-text-secondary leading-relaxed">
          {pageSubtitle}
        </p>

        {/* English Locale Disclaimer on Italian Screenshots */}
        {!isIt && (
          <div className="mt-4 rounded-lg border border-brand-aqua/30 bg-brand-aqua/5 p-3 sm:p-4 text-xs text-text-secondary leading-relaxed">
            <strong className="text-text-primary font-medium block mb-1">
              Note on reference screenshots:
            </strong>
            The screenshots in this guide were captured on a reference Android 14 device configured in Italian. For clarity, actions and descriptions below indicate both the English term and the corresponding Italian interface label visible in the images (such as «Autorizzazioni app» for App permissions and «Sincronizza ora» for Sync now).
          </div>
        )}

        <div className="mt-6 rounded-[14px] border border-divider bg-bg-card/40 p-4 sm:p-5 text-sm text-text-secondary space-y-2">
          <p className="font-medium text-text-primary">
            {isIt ? "Flusso di sincronizzazione da wearable via Connessione Salute" : "Wearable sync data flow via Health Connect"}
          </p>
          <p>
            {isIt
              ? "1. Il tuo smartwatch o tracker invia i dati alla sua applicazione ufficiale (es. Samsung Health, Garmin Connect, Zepp, Google Fit, Withings, Oura)."
              : "1. Your smartwatch or tracker sends data to its official companion app (e.g., Samsung Health, Garmin Connect, Zepp, Google Fit, Withings, Oura)."}
          </p>
          <p>
            {isIt
              ? "2. L'applicazione del produttore scrive le metriche supportate nel repository condiviso di Connessione Salute sul telefono."
              : "2. The companion app writes supported metrics into Android Health Connect on your phone."}
          </p>
          <p>
            {isIt
              ? "3. FitMesh Sync legge da Connessione Salute ed elabora i trend nella dashboard locale."
              : "3. FitMesh Sync reads from Health Connect and computes your dashboard trends locally."}
          </p>
        </div>
      </header>

      {/* 8 Numbered Steps */}
      <section className="space-y-12">
        {steps.map((step) => (
          <div
            key={step.id}
            id={`passo-${step.id}`}
            className="rounded-[16px] border border-divider bg-bg-card/50 p-6 sm:p-8 space-y-6"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-xl sm:text-2xl font-semibold text-text-primary">
                  {step.title}
                </h2>
                {step.statusBadge && (
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {step.statusBadge}
                  </span>
                )}
              </div>
              <div className="mt-3 space-y-2 text-sm leading-relaxed">
                <p>
                  <strong className="text-text-primary font-medium">
                    {isIt ? "Azione: " : "Action: "}
                  </strong>
                  <span className="text-text-secondary">{step.action}</span>
                </p>
                <p>
                  <strong className="text-text-primary font-medium">
                    {isIt ? "Risultato atteso: " : "Expected result: "}
                  </strong>
                  <span className="text-text-secondary">{step.expected}</span>
                </p>
              </div>
            </div>

            {/* Authentic Screenshot in Figure with Figcaption */}
            <figure className="py-2 flex flex-col items-center bg-bg-elevated/40 rounded-xl p-4 border border-divider/60">
              {/* eslint-disable-next-line @next/next/no-img-element -- Immagine WebP locale con dimensioni fisse per evitare costi Next Image Optimization */}
              <img
                src={step.imageSrc}
                alt={step.imageAlt}
                width={1080}
                height={2400}
                loading="lazy"
                decoding="async"
                className="w-full max-w-[280px] sm:max-w-[320px] h-auto rounded-xl border border-divider/80 shadow-md"
              />
              <figcaption className="mt-3 text-xs text-text-muted leading-relaxed text-center max-w-md">
                {step.caption}
              </figcaption>
            </figure>

            {/* Troubleshooting Note */}
            <div className="rounded-lg bg-bg-elevated/70 border border-divider/70 p-4 text-xs sm:text-sm text-text-secondary leading-relaxed">
              <strong className="text-text-primary font-medium block mb-1">
                {isIt ? "Cosa controllare se qualcosa va storto:" : "What to check if something goes wrong:"}
              </strong>
              {step.troubleshoot}
            </div>
          </div>
        ))}
      </section>

      {/* Troubleshooting Matrix */}
      <section className="mt-16 rounded-[16px] border border-divider bg-gradient-to-br from-bg-card to-bg-secondary p-6 sm:p-8 space-y-6">
        <h2 className="font-display text-2xl font-semibold text-text-primary">
          {isIt ? "Guida rapida alla diagnostica" : "Quick troubleshooting guide"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3 text-xs sm:text-sm">
          <div className="p-4 rounded-xl border border-divider bg-bg-card/70 space-y-2">
            <h3 className="font-semibold text-text-primary">
              {isIt ? "1. Dati assenti nella sorgente" : "1. Missing source data"}
            </h3>
            <p className="text-text-secondary leading-relaxed">
              {isIt
                ? "Se Connessione Salute non ha dati, FitMesh non ha letture da importare. Apri l'app del tuo orologio e avvia una sincronizzazione dal dispositivo al telefono."
                : "If Health Connect has no records, FitMesh has no readings to import. Open your watch companion app and trigger a sync from the device to the phone first."}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-divider bg-bg-card/70 space-y-2">
            <h3 className="font-semibold text-text-primary">
              {isIt ? "2. Permessi di lettura mancanti" : "2. Missing read permissions"}
            </h3>
            <p className="text-text-secondary leading-relaxed">
              {isIt
                ? "Se la sorgente contiene i dati ma FitMesh mostra zero o trattini, controlla Connessione Salute > Autorizzazioni app > FitMesh Sync e accertati che le autorizzazioni pertinenti siano attive."
                : "If source records exist but FitMesh displays zero or dashes, check Health Connect > App permissions > FitMesh Sync and verify that relevant read permissions are enabled."}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-divider bg-bg-card/70 space-y-2">
            <h3 className="font-semibold text-text-primary">
              {isIt ? "3. Aggiornamento in background" : "3. Background updates"}
            </h3>
            <p className="text-text-secondary leading-relaxed">
              {isIt
                ? "Il risparmio energetico può posticipare l'aggiornamento automatico. Puoi avviare un tentativo di sincronizzazione in primo piano aprendo FitMesh e toccando «Sincronizza ora»."
                : "Battery savers can defer automatic background sync. You can start a foreground sync attempt anytime by opening FitMesh and tapping «Sync now»."}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-divider flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-sm text-text-secondary">
            {isIt
              ? "Hai ancora dubbi sulla configurazione?"
              : "Still have questions about your setup?"}
          </div>
          <div className="flex gap-3">
            <Link
              href={`/${lc}/support`}
              className="px-4 py-2 rounded-pill border border-divider text-xs sm:text-sm text-text-primary hover:bg-white/5 transition"
            >
              {isIt ? "Torna al Supporto" : "Back to Support"}
            </Link>
            <a
              href="mailto:support@fitmesh.fit?subject=Configurazione%20Connessione%20Salute"
              className="px-4 py-2 rounded-pill btn-cta text-xs sm:text-sm"
            >
              {isIt ? "Scrivi all'assistenza" : "Contact support"}
            </a>
          </div>
        </div>
      </section>
    </article>
  );
}
