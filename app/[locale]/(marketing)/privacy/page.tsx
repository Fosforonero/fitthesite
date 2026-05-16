import type { Metadata } from "next";
import { locales, type Locale, getDictionary } from "@/lib/i18n";
import { LegalPage, Section, List, Callout } from "@/components/legal/LegalLayout";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

const SITE_URL = "https://www.fitmesh.fit";
const LAST_UPDATED_IT = "12 maggio 2026";
const LAST_UPDATED_EN = "May 12, 2026";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<Locale, string> = {
    it: "Privacy Policy",
    en: "Privacy Policy",
  };
  const desc: Record<Locale, string> = {
    it: "Come FitMesh Sync raccoglie, utilizza e protegge i dati di salute. Conforme GDPR.",
    en: "How FitMesh Sync collects, uses and safeguards health data. GDPR compliant.",
  };
  const lc = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  return {
    title: titles[lc],
    description: desc[lc],
    alternates: {
      canonical: `${SITE_URL}/${lc}/privacy`,
      languages: {
        it: `${SITE_URL}/it/privacy`,
        en: `${SITE_URL}/en/privacy`,
        "x-default": `${SITE_URL}/it/privacy`,
      },
    },
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lc: Locale = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  const t = await getDictionary(lc);
  const lastUpdated = `${t.legal.last_updated}: ${lc === "it" ? LAST_UPDATED_IT : LAST_UPDATED_EN}`;

  return (
    <>
      <Breadcrumbs items={[{ name: "Privacy Policy", path: `/${lc}/privacy` }]} locale={lc} />
      <LegalPage kicker={t.legal.section} title={t.legal.privacy_title} lastUpdated={lastUpdated}>
        {lc === "it" ? <PrivacyIT /> : <PrivacyEN />}
      </LegalPage>
    </>
  );
}

function PrivacyIT() {
  return (
    <>
      <Section title="1. Introduzione">
        <p>
          FitMesh Sync ("noi", "nostro", "l'app") rispetta la tua privacy e si impegna a proteggere
          i tuoi dati personali. Questa Privacy Policy spiega come raccogliamo, utilizziamo e
          proteggiamo le informazioni relative alla salute quando utilizzi la nostra applicazione
          mobile FitMesh Sync (<em>com.fitmeshsync.app</em> su Google Play).
        </p>
      </Section>

      <Section title="2. Informazioni che raccogliamo">
        <p>
          FitMesh Sync raccoglie i seguenti dati relativi alla salute dal tuo dispositivo Android
          tramite servizi autorizzati (Health Connect, Samsung Health Data SDK):
        </p>
        <List items={[
          ["Attività fisica", "passi, distanza percorsa, calorie bruciate (attive e totali), piani saliti"],
          ["Frequenza cardiaca", "media, range minimo/massimo, frequenza a riposo, HRV"],
          ["Sonno", "durata totale, fasi (profondo, REM, leggero, sveglio), orari inizio/fine"],
          ["Composizione corporea", "peso, altezza, BMI (se forniti dall'utente)"],
          ["Altri parametri", "saturazione ossigeno (SpO₂), VO₂ max, temperatura cutanea, dislivello"],
          ["Sessioni di esercizio", "tipo di attività, durata, distanza, calorie"],
        ]} />
        <Callout>
          Importante: questi dati vengono letti solo dai servizi di salute già presenti sul tuo
          dispositivo e solo dopo che hai concesso esplicitamente i permessi necessari.
        </Callout>
      </Section>

      <Section title="3. Come utilizziamo i dati">
        <p>I dati raccolti vengono utilizzati esclusivamente per:</p>
        <List items={[
          ["Sincronizzazione", "inviare le informazioni di salute al server che configuri tu"],
          ["Visualizzazione", "permettere la visualizzazione dei dati sulla dashboard web e nell'app"],
          ["Migliorare l'esperienza", "diagnosticare problemi tecnici quando ce li segnali via email"],
        ]} />
        <p className="text-text-primary font-medium">
          Non vendiamo, non condividiamo e non utilizziamo i tuoi dati per pubblicità o marketing.
        </p>
      </Section>

      <Section title="4. Dove vengono salvati i dati">
        <p>
          I dati vengono inviati esclusivamente al server che configuri tu nell'app. Puoi scegliere
          tra: il nostro server pubblico, una tua VPS personale, un NAS di casa, o qualsiasi altro
          endpoint compatibile con la nostra API. FitMesh Sync non invia dati a server di terze parti
          o a servizi esterni non da te specificati.
        </p>
        <p>
          I dati rimangono sul tuo dispositivo in una cache locale fino al momento della
          sincronizzazione. Dopo la sincronizzazione, i dati vengono memorizzati sul server scelto
          secondo le tue policy.
        </p>
      </Section>

      <Section title="5. Permessi richiesti">
        <p>FitMesh Sync richiede i seguenti permessi:</p>
        <List items={[
          ["Health Connect", "per leggere i dati di salute dal sistema operativo Android"],
          ["Samsung Health (opzionale)", "se hai un Galaxy Watch, per dati aggiuntivi non esposti da Health Connect"],
          ["Accesso Internet", "per sincronizzare i dati con il server scelto"],
          ["Sync in background", "per inviare dati periodicamente anche quando l'app è chiusa"],
          ["Esclusione ottimizzazione batteria", "per garantire la sync regolare (richiesto su Android 14+)"],
        ]} />
        <p>
          Tutti i permessi sono richiesti esplicitamente e puoi revocarli in qualsiasi momento dalle
          impostazioni del dispositivo o dell'applicazione.
        </p>
      </Section>

      <Section title="6. Sicurezza dei dati">
        <List items={[
          ["Trasporto", "i dati vengono trasmessi tramite HTTPS quando il server di destinazione lo supporta"],
          ["Persistenza locale", "la cache locale viene svuotata dopo invio confermato"],
          ["Nessun tracker", "non includiamo SDK di analytics, advertising o profilazione nell'app"],
          ["Codice sorgente", "il codice del backend è ispezionabile pubblicamente per audit"],
        ]} />
      </Section>

      <Section title="7. I tuoi diritti">
        <p>Hai il diritto di:</p>
        <List items={[
          ["Accedere", "richiedere una copia dei tuoi dati salvati sul nostro server pubblico"],
          ["Cancellare", "richiedere la cancellazione completa dei tuoi dati"],
          ["Revocare permessi", "disabilitare i permessi di accesso ai dati di salute in qualsiasi momento"],
          ["Portabilità", "ricevere i tuoi dati in formato JSON strutturato"],
          ["Disinstallare", "rimuovere l'applicazione e tutti i dati associati"],
        ]} />
        <p>
          Per esercitare questi diritti, scrivici a{" "}
          <a className="text-brand-aqua hover:text-brand-blue underline underline-offset-4" href="mailto:privacy@fitmesh.fit">
            privacy@fitmesh.fit
          </a>
          . Rispondiamo entro 30 giorni.
        </p>
      </Section>

      <Section title="8. Dati di terze parti">
        <p>FitMesh Sync si integra con i seguenti servizi:</p>
        <List items={[
          ["Health Connect (Google)", "servizio ufficiale Android per dati di salute"],
          ["Samsung Health Data SDK", "API ufficiale Samsung per Galaxy Watch"],
          ["Google Play Billing", "per gestione acquisti in-app"],
          ["Google Analytics 4 (solo sito web, opt-in)", "analytics anonimi attivati solo dopo consenso esplicito tramite banner cookie"],
          ["Vercel", "hosting del sito web fitmesh.fit"],
        ]} />
        <p>
          Maggiori dettagli sull'utilizzo di Google Analytics nella nostra{" "}
          <a href="/it/cookies" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">Cookie Policy</a>.
        </p>
      </Section>

      <Section title="9. Modifiche">
        <p>
          Possiamo aggiornare questa Privacy Policy di tanto in tanto. Per modifiche significative
          ti notificheremo via email o mostrando un avviso nell'app prima della prossima
          sincronizzazione.
        </p>
      </Section>

      <Section title="10. Minori">
        <p>
          FitMesh Sync non è destinata a utenti di età inferiore ai 13 anni. Non raccogliamo
          consapevolmente dati personali da minori di 13 anni.
        </p>
      </Section>

      <Section title="11. Conformità GDPR">
        <p>
          Se sei residente nell'Unione Europea, questa Privacy Policy è conforme al Regolamento UE
          2016/679 (GDPR). Hai diritto di accesso, rettifica, cancellazione, limitazione del
          trattamento, portabilità e opposizione. Puoi presentare reclamo all'Autorità Garante per
          la Protezione dei Dati Personali:{" "}
          <a className="text-brand-aqua hover:text-brand-blue underline underline-offset-4" href="https://www.garanteprivacy.it/" target="_blank" rel="noopener">
            garanteprivacy.it
          </a>
          .
        </p>
      </Section>

      <Section title="12. Contatti">
        <div className="rounded-[14px] border border-divider bg-bg-card/60 p-6">
          <ul className="space-y-1.5 text-sm">
            <li><span className="text-text-muted">Privacy:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:privacy@fitmesh.fit">privacy@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Supporto:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:support@fitmesh.fit">support@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Generale:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:hello@fitmesh.fit">hello@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Sito:</span> <a className="text-brand-aqua hover:text-brand-blue" href="https://www.fitmesh.fit">www.fitmesh.fit</a></li>
          </ul>
        </div>
      </Section>
    </>
  );
}

function PrivacyEN() {
  return (
    <>
      <Section title="1. Introduction">
        <p>
          FitMesh Sync ("we", "our", "the app") respects your privacy and is committed to
          protecting your personal data. This Privacy Policy explains how we collect, use and
          safeguard health information when you use our mobile application FitMesh Sync
          (<em>com.fitmeshsync.app</em> on Google Play).
        </p>
      </Section>

      <Section title="2. Information we collect">
        <p>
          FitMesh Sync reads the following health-related data from your Android device via
          authorized services (Health Connect, Samsung Health Data SDK):
        </p>
        <List items={[
          ["Physical activity", "steps, distance travelled, calories burned (active and total), floors climbed"],
          ["Heart rate", "average, min/max range, resting heart rate, HRV"],
          ["Sleep", "total duration, stages (deep, REM, light, awake), start/end times"],
          ["Body composition", "weight, height, BMI (when provided by the user)"],
          ["Other metrics", "oxygen saturation (SpO₂), VO₂ max, skin temperature, elevation gain"],
          ["Exercise sessions", "activity type, duration, distance, calories"],
        ]} />
        <Callout>
          Important: this data is read only from health services already present on your device
          and only after you have explicitly granted the required permissions.
        </Callout>
      </Section>

      <Section title="3. How we use the data">
        <p>The collected data is used exclusively to:</p>
        <List items={[
          ["Sync", "send your health information to the server you configure"],
          ["Visualization", "display the data on the web dashboard and inside the app"],
          ["Improve the product", "diagnose technical issues when you report them by email"],
        ]} />
        <p className="text-text-primary font-medium">
          We never sell, share or use your data for advertising or marketing.
        </p>
      </Section>

      <Section title="4. Where data is stored">
        <p>
          Data is sent exclusively to the server you configure in the app. You can choose between
          our public server, your own VPS, a home NAS, or any other endpoint compatible with our
          API. FitMesh Sync does not send data to any third-party server unless you explicitly
          configure it.
        </p>
        <p>
          Data stays on your device in a local cache until sync. After sync, data is stored on the
          server you picked, subject to your own policies.
        </p>
      </Section>

      <Section title="5. Required permissions">
        <p>FitMesh Sync requires the following permissions:</p>
        <List items={[
          ["Health Connect", "to read health data from the Android operating system"],
          ["Samsung Health (optional)", "if you own a Galaxy Watch, for extra data not exposed by Health Connect"],
          ["Internet access", "to sync data with the chosen server"],
          ["Background sync", "to send data periodically even when the app is closed"],
          ["Battery optimization exemption", "to guarantee regular sync (required on Android 14+)"],
        ]} />
        <p>
          All permissions are requested explicitly and you can revoke them at any time from the
          device or app settings.
        </p>
      </Section>

      <Section title="6. Data security">
        <List items={[
          ["Transport", "data is transmitted via HTTPS when the destination server supports it"],
          ["Local persistence", "the local cache is cleared after delivery is confirmed"],
          ["No tracker", "we include no analytics, advertising or profiling SDKs inside the app"],
          ["Open backend", "the backend code is publicly inspectable for audit purposes"],
        ]} />
      </Section>

      <Section title="7. Your rights">
        <p>You have the right to:</p>
        <List items={[
          ["Access", "request a copy of your data stored on our public server"],
          ["Delete", "request full deletion of your data"],
          ["Revoke permissions", "disable health-data permissions at any time"],
          ["Portability", "receive your data in a structured JSON format"],
          ["Uninstall", "remove the app and all associated data"],
        ]} />
        <p>
          To exercise these rights, email us at{" "}
          <a className="text-brand-aqua hover:text-brand-blue underline underline-offset-4" href="mailto:privacy@fitmesh.fit">
            privacy@fitmesh.fit
          </a>
          . We reply within 30 days.
        </p>
      </Section>

      <Section title="8. Third-party data processors">
        <p>FitMesh Sync integrates with the following services:</p>
        <List items={[
          ["Health Connect (Google)", "official Android service for health data"],
          ["Samsung Health Data SDK", "official Samsung API for Galaxy Watch"],
          ["Google Play Billing", "for in-app purchase handling"],
          ["Google Analytics 4 (website only, opt-in)", "anonymous analytics enabled only after explicit consent via the cookie banner"],
          ["Vercel", "hosting for the fitmesh.fit website"],
        ]} />
        <p>
          More details about Google Analytics usage in our{" "}
          <a href="/en/cookies" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">Cookie Policy</a>.
        </p>
      </Section>

      <Section title="9. Changes">
        <p>
          We may update this Privacy Policy from time to time. For material changes we will notify
          you by email or with an in-app notice before the next sync.
        </p>
      </Section>

      <Section title="10. Minors">
        <p>
          FitMesh Sync is not intended for users under 13 years of age. We do not knowingly collect
          personal data from minors under 13.
        </p>
      </Section>

      <Section title="11. GDPR compliance">
        <p>
          If you reside in the European Union, this Privacy Policy complies with Regulation (EU)
          2016/679 (GDPR). You have rights of access, rectification, erasure, restriction of
          processing, data portability and objection. You may file a complaint with your national
          data protection authority.
        </p>
      </Section>

      <Section title="12. Contact">
        <div className="rounded-[14px] border border-divider bg-bg-card/60 p-6">
          <ul className="space-y-1.5 text-sm">
            <li><span className="text-text-muted">Privacy:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:privacy@fitmesh.fit">privacy@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Support:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:support@fitmesh.fit">support@fitmesh.fit</a></li>
            <li><span className="text-text-muted">General:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:hello@fitmesh.fit">hello@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Web:</span> <a className="text-brand-aqua hover:text-brand-blue" href="https://www.fitmesh.fit">www.fitmesh.fit</a></li>
          </ul>
        </div>
      </Section>
    </>
  );
}
