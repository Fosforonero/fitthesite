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
    ? "Istruzioni con schermate autentiche per Android: trovare Connessione Salute, verificare l'app sorgente, concedere i permessi a FitMesh Sync e avviare la prima sincronizzazione."
    : "Step-by-step instructions with verified Android screenshots: find Health Connect, check your source app, grant permissions to FitMesh Sync, and run your first sync.";

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
}

const STEPS_IT: StepItem[] = [
  {
    id: 1,
    title: "1. Trova e apri Connessione Salute",
    action: "Apri le Impostazioni di Android, tocca Sicurezza e privacy, scorri fino alla sezione Privacy e tocca Connessione Salute.",
    expected: "Si apre la schermata principale di Connessione Salute con la voce «Gestisci l'accesso delle app ai dati sulla salute».",
    troubleshoot: "Su Android 14 o successivo Connessione Salute è integrata nel sistema operativo. Su Android 9-13 è necessario installare l'app Connessione Salute dal Google Play Store. Sugli smartphone Samsung Galaxy, il percorso può trovarsi anche in Impostazioni > Sicurezza e privacy > Connessione Salute oppure direttamente nelle impostazioni di Samsung Health.",
    imageSrc: "/support/health-connect/01-impostazioni-connessione-salute.webp",
    imageAlt: "Schermata Impostazioni Android 14 con voce Connessione Salute evidenziata",
  },
  {
    id: 2,
    title: "2. Accedi alla gestione delle autorizzazioni app",
    action: "Nella schermata principale di Connessione Salute, tocca Autorizzazioni app per consultare le applicazioni abilitate o in attesa di configurazione.",
    expected: "Visualizzi il riepilogo delle applicazioni che interagiscono con Connessione Salute, suddivise tra app con accesso consentito e non consentito.",
    troubleshoot: "Se non vedi alcuna applicazione nell'elenco, verifica di aver già installato sul dispositivo sia l'app del tuo dispositivo indossabile sia FitMesh Sync.",
    imageSrc: "/support/health-connect/02-connessione-salute-autorizzazioni-app.webp",
    imageAlt: "Schermata principale di Connessione Salute con il pulsante Autorizzazioni app",
  },
  {
    id: 3,
    title: "3. Verifica che l'app del tuo wearable scriva i dati",
    action: "Tocca il nome dell'app che riceve i dati dal tuo smartwatch o tracker (es. Google Play services, Samsung Health, Garmin Connect, Zepp, Oura, Withings) e controlla i permessi di scrittura.",
    expected: "I permessi di scrittura per passi, frequenza cardiaca, sonno, calorie e distanza risultano attivi.",
    troubleshoot: "FitMesh Sync legge i dati da Connessione Salute: non si collega direttamente all'hardware dell'orologio. Se l'app del tuo smartwatch non ha autorizzazioni di scrittura o non è collegata a Connessione Salute, l'archivio rimarrà vuoto. Apri l'app del produttore e attiva la condivisione dati verso Connessione Salute dalle sue impostazioni.",
    imageSrc: "/support/health-connect/03-permessi-app-sorgente.webp",
    imageAlt: "Schermata di Connessione Salute con i permessi di scrittura dell'app sorgente",
  },
  {
    id: 4,
    title: "4. Seleziona FitMesh Sync dall'elenco app",
    action: "Torna alla schermata Autorizzazioni app e seleziona FitMesh Sync, che inizialmente compare nella sezione Accesso non consentito.",
    expected: "Si apre la schermata specifica per configurare i permessi di FitMesh Sync.",
    troubleshoot: "Se FitMesh Sync non compare nell'elenco, apri l'app FitMesh Sync sul telefono, completa l'accesso con il tuo account ed esegui il primo avvio.",
    imageSrc: "/support/health-connect/04-elenco-app-fitmesh.webp",
    imageAlt: "Elenco delle applicazioni in Connessione Salute con FitMesh Sync sotto Accesso non consentito",
  },
  {
    id: 5,
    title: "5. Concedi le autorizzazioni di lettura a FitMesh Sync",
    action: "Attiva l'opzione generale «Consenti tutte» oppure abilita singolarmente le autorizzazioni di lettura desiderate (Passi, Battito cardiaco a riposo, Sonno, Calorie totali bruciate, Distanza, Esercizio fisico).",
    expected: "Gli interruttori delle metriche selezionate passano sullo stato attivo. FitMesh Sync richiede esclusivamente permessi di lettura e non scrive né altera i tuoi dati in Connessione Salute.",
    troubleshoot: "Se lasci disattivata una metrica specifica (come il sonno o la frequenza cardiaca), FitMesh non potrà leggere quel dato e la card corrispondente nella dashboard rimarrà priva di registrazioni.",
    imageSrc: "/support/health-connect/05-permessi-lettura-fitmesh.webp",
    imageAlt: "Schermata di autorizzazione di FitMesh Sync con Consenti tutte e permessi di lettura attivi",
  },
  {
    id: 6,
    title: "6. Apri FitMesh Sync e avvia la sincronizzazione",
    action: "Apri l'app FitMesh Sync. Nella schermata principale individua la card Sincronizzazione e premi il pulsante Sincronizza ora.",
    expected: "L'app interroga le API locali di Connessione Salute, importa le metriche registrate e aggiorna i riepiloghi nella dashboard.",
    troubleshoot: "Se compare il messaggio «Attenzione: Nessun wearable rilevato», significa che FitMesh ha i permessi corretti ma Connessione Salute non ha ancora ricevuto dati per la data odierna. Apri l'app del tuo dispositivo indossabile, verifica che l'orologio si sia sincronizzato con il telefono, quindi torna in FitMesh e premi nuovamente Sincronizza ora.",
    imageSrc: "/support/health-connect/06-dashboard-sincronizza-ora.webp",
    imageAlt: "Dashboard di FitMesh Sync con la card Sincronizzazione e il pulsante Sincronizza ora",
  },
  {
    id: 7,
    title: "7. Controlla l'esito nel Centro Sincronizzazione",
    action: "Nella card Sincronizzazione tocca il pulsante Diagnostica per visualizzare il Centro Sincronizzazione dettagliato.",
    expected: "Visualizzi l'ora dell'ultimo sync, la previsione del prossimo sync automatico (~15 min) e la provenienza metrica per metrica (Passi, Frequenza cardiaca, Sonno, Calorie, Distanza).",
    troubleshoot: "Se una riga indica «Nessuna sorgente», toccando la voce verifichi se il dato non è stato fornito dall'orologio oppure se manca l'autorizzazione di lettura in Connessione Salute. In questo modo distingui chiaramente una metrica non rilevata da un permesso mancante.",
    imageSrc: "/support/health-connect/07-centro-sincronizzazione-diagnostica.webp",
    imageAlt: "Schermata Centro Sincronizzazione con riepilogo delle sorgenti dati per ciascuna metrica",
  },
  {
    id: 8,
    title: "8. (Facoltativo) Configura l'uso della batteria per il background",
    action: "Se desideri che la sincronizzazione avvenga periodicamente anche senza aprire manualmente l'app, apri le Impostazioni Android > App > FitMesh Sync > Utilizzo della batteria per l'app e scegli Senza limitazioni.",
    expected: "Il selettore dell'utilizzo batteria si sposta su «Senza limitazioni».",
    troubleshoot: "Questo passaggio è facoltativo: non è obbligatorio per usare l'app. Il comando «Sincronizza ora» funziona sempre anche con il profilo predefinito «Ottimizzato». Tieni presente che su dispositivi di vari produttori (Samsung, Xiaomi, OnePlus), i sistemi interni di risparmio energetico possono comunque ritardare le sincronizzazioni automatiche a schermo spento.",
    imageSrc: "/support/health-connect/08-impostazioni-batteria-background.webp",
    imageAlt: "Schermata Impostazioni Android Utilizzo della batteria per l'app con opzione Senza limitazioni",
  },
];

const STEPS_EN: StepItem[] = [
  {
    id: 1,
    title: "1. Find and open Health Connect",
    action: "Open Android Settings, tap Security & privacy, scroll down to the Privacy section, and tap Health Connect.",
    expected: "The Health Connect main screen opens showing «Manage app access to health data».",
    troubleshoot: "On Android 14 or newer, Health Connect is built into system settings. On Android 9-13, install the standalone Health Connect app from Google Play Store. On Samsung Galaxy smartphones, this menu may also appear under Settings > Security & privacy > Health Connect or inside Samsung Health settings.",
    imageSrc: "/support/health-connect/01-impostazioni-connessione-salute.webp",
    imageAlt: "Android 14 Settings screen highlighting the Health Connect entry under Privacy",
  },
  {
    id: 2,
    title: "2. Open app permissions",
    action: "From the Health Connect home screen, tap App permissions to review which applications are allowed or pending access.",
    expected: "You see the list of apps requesting access to Health Connect, split into allowed and not allowed categories.",
    troubleshoot: "If no apps are listed, verify that both your wearable companion app and FitMesh Sync are already installed on this phone.",
    imageSrc: "/support/health-connect/02-connessione-salute-autorizzazioni-app.webp",
    imageAlt: "Health Connect home screen displaying App permissions section",
  },
  {
    id: 3,
    title: "3. Verify your wearable app writes health data",
    action: "Tap the app receiving data from your smartwatch or tracker (e.g., Google Play services, Samsung Health, Garmin Connect, Zepp, Oura, Withings) and verify its write permissions.",
    expected: "Write permissions for steps, heart rate, sleep, calories, and distance are turned on.",
    troubleshoot: "FitMesh Sync reads data from Health Connect; it does not connect directly to the watch hardware. If your watch app has not written data or lacks write access, Health Connect remains empty. Open your watch manufacturer app and enable sync to Health Connect in its settings.",
    imageSrc: "/support/health-connect/03-permessi-app-sorgente.webp",
    imageAlt: "Health Connect permissions screen showing write permissions for the source application",
  },
  {
    id: 4,
    title: "4. Select FitMesh Sync from the app list",
    action: "Return to the App permissions screen and select FitMesh Sync, which initially appears under Not allowed access.",
    expected: "The dedicated permission configuration screen for FitMesh Sync opens.",
    troubleshoot: "If FitMesh Sync is not visible in the list, open the FitMesh Sync app, sign in to your account, and complete initial launch setup.",
    imageSrc: "/support/health-connect/04-elenco-app-fitmesh.webp",
    imageAlt: "Health Connect app permissions list showing FitMesh Sync under Not allowed",
  },
  {
    id: 5,
    title: "5. Grant read permissions to FitMesh Sync",
    action: "Turn on the «Allow all» toggle, or selectively enable the read permissions you need (Steps, Resting heart rate, Sleep, Total calories burned, Distance, Exercise).",
    expected: "The toggles for the selected metrics turn on. FitMesh Sync requires read-only permissions and never modifies or writes data into your Health Connect storage.",
    troubleshoot: "If you leave a specific metric turned off (such as sleep or heart rate), FitMesh cannot read that data and its dashboard card will stay empty.",
    imageSrc: "/support/health-connect/05-permessi-lettura-fitmesh.webp",
    imageAlt: "FitMesh Sync permissions screen with Allow all and read permissions enabled",
  },
  {
    id: 6,
    title: "6. Open FitMesh Sync and run your first sync",
    action: "Open the FitMesh Sync app. On the home dashboard, locate the Synchronization card and tap the Sync now button.",
    expected: "The app queries the local Health Connect APIs, imports logged records, and updates the dashboard summaries.",
    troubleshoot: "If you see the warning «No wearable detected», FitMesh has valid permissions but Health Connect has not received records for today yet. Open your wearable app, make sure your watch has synced with the phone, then return to FitMesh and tap Sync now again.",
    imageSrc: "/support/health-connect/06-dashboard-sincronizza-ora.webp",
    imageAlt: "FitMesh Sync home dashboard with Synchronization card and Sync now button",
  },
  {
    id: 7,
    title: "7. Inspect status in the Sync Center",
    action: "In the Synchronization card, tap Diagnostica to open the detailed Sync Center.",
    expected: "You see the last sync timestamp, the estimated next automatic sync (~15 min), and the metric-by-metric source breakdown (Steps, Heart rate, Sleep, Calories, Distance).",
    troubleshoot: "If a metric shows «No source», tapping that row clarifies whether the source app omitted that metric or read permissions are missing in Health Connect. This lets you distinguish missing readings from missing permissions.",
    imageSrc: "/support/health-connect/07-centro-sincronizzazione-diagnostica.webp",
    imageAlt: "Sync Center screen showing source app breakdown for each metric",
  },
  {
    id: 8,
    title: "8. (Optional) Configure background battery usage",
    action: "If you want synchronization to run periodically without opening the app, go to Android Settings > Apps > FitMesh Sync > App battery usage and select Unrestricted.",
    expected: "The battery usage radio button switches to «Unrestricted».",
    troubleshoot: "This step is optional: it is not required to use the app. Manual sync with «Sync now» always works even under the default «Optimized» profile. Keep in mind that on various manufacturer skins (Samsung, Xiaomi, OnePlus), background managers can still defer background tasks while the screen is off.",
    imageSrc: "/support/health-connect/08-impostazioni-batteria-background.webp",
    imageAlt: "Android App battery usage settings screen with Unrestricted option selected",
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
    ? "Guida dettagliata con schermate autentiche per configurare Connessione Salute, verificare l'app del tuo orologio e completare la sincronizzazione con FitMesh Sync."
    : "Detailed guide with verified screenshots to configure Health Connect, verify your wearable app, and complete your sync with FitMesh Sync.";

  const crumbHome = isIt ? "Home" : "Home";
  const crumbSupport = isIt ? "Supporto" : "Support";
  const crumbCurrent = isIt ? "Guida Connessione Salute" : "Health Connect Guide";

  // Structured Data (HowTo + BreadcrumbList)
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: isIt
      ? "Come configurare Connessione Salute con FitMesh Sync su Android"
      : "How to set up Health Connect with FitMesh Sync on Android",
    description: pageSubtitle,
    inLanguage: schemaLanguage(lc),
    totalTime: "PT3M",
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

        <div className="mt-6 rounded-[14px] border border-divider bg-bg-card/40 p-4 sm:p-5 text-sm text-text-secondary space-y-2">
          <p className="font-medium text-text-primary">
            {isIt ? "Prima di iniziare: come funziona il flusso dati" : "Before you begin: how data flows"}
          </p>
          <p>
            {isIt
              ? "1. Il tuo smartwatch o tracker invia i dati alla sua applicazione ufficiale (es. Samsung Health, Garmin Connect, Zepp, Google Fit, Withings, Oura)."
              : "1. Your smartwatch or tracker sends data to its official companion app (e.g., Samsung Health, Garmin Connect, Zepp, Google Fit, Withings, Oura)."}
          </p>
          <p>
            {isIt
              ? "2. L'applicazione del produttore scrive le metriche nel repository condiviso di Connessione Salute sul telefono."
              : "2. The manufacturer companion app writes those health metrics into Android Health Connect on your phone."}
          </p>
          <p>
            {isIt
              ? "3. FitMesh Sync legge da Connessione Salute ed elabora i trend nella tua dashboard locale (senza modificare i dati originali)."
              : "3. FitMesh Sync reads from Health Connect and computes your dashboard trends locally (without altering the original records)."}
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
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-text-primary">
                {step.title}
              </h2>
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

            {/* Authentic Screenshot */}
            <div className="py-2 flex justify-center bg-bg-elevated/40 rounded-xl p-4 border border-divider/60">
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
            </div>

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

      {/* Deep-dive Troubleshooting Matrix */}
      <section className="mt-16 rounded-[16px] border border-divider bg-gradient-to-br from-bg-card to-bg-secondary p-6 sm:p-8 space-y-6">
        <h2 className="font-display text-2xl font-semibold text-text-primary">
          {isIt ? "Guida rapida ai problemi più comuni" : "Quick troubleshooting guide"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3 text-xs sm:text-sm">
          <div className="p-4 rounded-xl border border-divider bg-bg-card/70 space-y-2">
            <h3 className="font-semibold text-text-primary">
              {isIt ? "1. Dati assenti nella sorgente" : "1. Missing source data"}
            </h3>
            <p className="text-text-secondary leading-relaxed">
              {isIt
                ? "Se Connessione Salute non ha dati, FitMesh non può leggere nulla. Apri l'app del tuo orologio e forza una sincronizzazione manuale dal dispositivo al telefono."
                : "If Health Connect has no records, FitMesh cannot read anything. Open your watch app and trigger a sync from the device to the phone first."}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-divider bg-bg-card/70 space-y-2">
            <h3 className="font-semibold text-text-primary">
              {isIt ? "2. Permessi di lettura mancanti" : "2. Missing read permissions"}
            </h3>
            <p className="text-text-secondary leading-relaxed">
              {isIt
                ? "Se la sorgente contiene i dati ma FitMesh mostra zero o trattini, controlla Connessione Salute > Autorizzazioni app > FitMesh Sync e accertati che «Consenti tutte» sia attivo."
                : "If source records exist but FitMesh shows zero or dashes, check Health Connect > App permissions > FitMesh Sync and confirm «Allow all» is active."}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-divider bg-bg-card/70 space-y-2">
            <h3 className="font-semibold text-text-primary">
              {isIt ? "3. Sync in background in ritardo" : "3. Deferred background sync"}
            </h3>
            <p className="text-text-secondary leading-relaxed">
              {isIt
                ? "I sistemi di risparmio energetico possono ritardare l'aggiornamento automatico. Puoi sempre sincronizzare immediatamente aprendo FitMesh e toccando «Sincronizza ora»."
                : "Android power saving can defer background jobs. You can always refresh immediately by opening FitMesh and tapping «Sync now»."}
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
