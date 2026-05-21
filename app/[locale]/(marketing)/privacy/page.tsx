import type { Metadata } from "next";
import { locales, type Locale, getDictionary } from "@/lib/i18n";
import { LegalPage, Section, List, Callout } from "@/components/legal/LegalLayout";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

const SITE_URL = "https://www.fitmesh.fit";
const LAST_UPDATED_IT = "21 maggio 2026";
const LAST_UPDATED_EN = "May 21, 2026";

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
      <Section title="1. Titolare del trattamento">
        <div className="rounded-[14px] border border-divider bg-bg-card/60 p-6">
          <ul className="space-y-1.5 text-sm">
            <li><span className="text-text-muted">Titolare:</span> Matteo Pizzi, persona fisica titolare di FitMesh Sync</li>
            <li><span className="text-text-muted">Email contatto privacy:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:privacy@fitmesh.fit">privacy@fitmesh.fit</a></li>
            <li><span className="text-text-muted">DPO (Data Protection Officer):</span> non designato. Il trattamento non rientra nei casi obbligatori previsti dall'art. 37 GDPR (autorità pubblica, monitoraggio sistematico su larga scala, categorie particolari su larga scala). Per qualsiasi richiesta sulla privacy contattare l'email sopra.</li>
          </ul>
        </div>
      </Section>

      <Section title="2. Introduzione">
        <p>
          FitMesh Sync ("noi", "nostro", "l'app") rispetta la tua privacy e si impegna a proteggere
          i tuoi dati personali. Questa Privacy Policy spiega come raccogliamo, utilizziamo e
          proteggiamo le informazioni relative alla salute quando utilizzi la nostra applicazione
          mobile FitMesh Sync (<em>com.fitmeshsync.app</em> su Google Play).
        </p>
        <p>
          Base giuridica del trattamento: art. 6(1)(b) GDPR (esecuzione del servizio richiesto
          dall'utente) e art. 9(2)(a) GDPR (consenso esplicito al trattamento di dati relativi alla
          salute, fornito tramite le autorizzazioni Health Connect/Samsung Health all'interno
          dell'app).
        </p>
      </Section>

      <Section title="3. Informazioni che raccogliamo">
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
          ["Account", "indirizzo email (per autenticazione tramite Supabase Auth) e identificativo dispositivo"],
        ]} />
        <Callout>
          Importante: questi dati vengono letti solo dai servizi di salute già presenti sul tuo
          dispositivo e solo dopo che hai concesso esplicitamente i permessi necessari.
        </Callout>
      </Section>

      <Section title="4. Come utilizziamo i dati">
        <p>I dati raccolti vengono utilizzati esclusivamente per:</p>
        <List items={[
          ["Sincronizzazione", "ricevere e archiviare le tue metriche di salute sul nostro backend cloud"],
          ["Visualizzazione", "permettere la visualizzazione dei dati sulla dashboard dell'app"],
          ["Supporto", "diagnosticare problemi tecnici quando ce li segnali via email"],
          ["Notifiche", "inviare avvisi configurabili (es. promemoria sync) tramite Firebase Cloud Messaging"],
        ]} />
        <p className="text-text-primary font-medium">
          Non vendiamo, non condividiamo e non utilizziamo i tuoi dati per pubblicità o marketing.
          Non esiste alcuna profilazione automatizzata che produca effetti giuridici sull'utente.
        </p>
      </Section>

      <Section title="5. Dove vengono salvati i dati">
        <p>
          I dati sincronizzati vengono inviati al backend FitMesh Sync ospitato su:
        </p>
        <List items={[
          ["Vercel Inc.", "hosting dell'API serverless fitmesh.fit (regione preferita: Europa fra1; alcuni edge function girano nella regione più vicina all'utente)"],
          ["Supabase Inc.", "database PostgreSQL gestito + autenticazione + storage (progetto in regione EU, eu-central-1 Frankfurt)"],
        ]} />
        <p>
          I dati rimangono sul tuo dispositivo Android in una cache locale fino al momento della
          sincronizzazione. Dopo la conferma di ricezione, la cache locale viene svuotata.
        </p>
      </Section>

      <Section title="6. Trasferimento dati extra-UE">
        <p>
          Il database principale (Supabase Postgres) è ospitato in Unione Europea (Francoforte,
          Germania). Tuttavia, alcuni servizi accessori comportano un trasferimento verso paesi
          terzi (in particolare gli Stati Uniti):
        </p>
        <List items={[
          ["Vercel (USA)", "edge runtime e logging delle richieste. Trasferimento basato su Standard Contractual Clauses (SCC) approvate dalla Commissione Europea (decisione 2021/914) e su Data Processing Addendum sottoscritto con Vercel"],
          ["Resend (USA)", "invio email transazionali (conferma signup beta, comunicazioni di supporto). Trasferimento basato su SCC + DPA"],
          ["Firebase Cloud Messaging (Google LLC, USA)", "trasporto delle notifiche push. Google aderisce alle SCC + Data Privacy Framework"],
          ["Google Sign-In (Google LLC, USA)", "autenticazione opzionale tramite account Google. Trasferimento basato su SCC + DPF"],
        ]} />
        <p>
          Prima di trasferire dati verso gli USA abbiamo valutato il rischio (Transfer Impact
          Assessment) considerando: i dati trasferiti sono limitati e non includono identificatori
          biometrici puri; le SCC includono clausole di sospensione in caso di richieste da
          autorità governative; i fornitori scelti aderiscono al Data Privacy Framework UE-USA
          dove disponibile.
        </p>
      </Section>

      <Section title="7. Conservazione dei dati (retention)">
        <List items={[
          ["Metriche di salute", "conservate finché l'account utente è attivo. Cancellate entro 30 giorni dalla richiesta di cancellazione dell'account o dalla disinstallazione confermata"],
          ["Log applicativi e sync log", "conservati 90 giorni a fini di troubleshooting, poi eliminati automaticamente"],
          ["Email di contatto (privacy/support)", "conservate 24 mesi per garantire continuità del supporto, poi cancellate"],
          ["Backup database", "rotazione 7 giorni su backup Supabase point-in-time recovery"],
          ["Dati account beta signup", "conservati fino al lancio pubblico, poi anonimizzati o cancellati"],
        ]} />
      </Section>

      <Section title="8. Permessi richiesti">
        <p>FitMesh Sync richiede i seguenti permessi:</p>
        <List items={[
          ["Health Connect", "per leggere i dati di salute dal sistema operativo Android"],
          ["Samsung Health (opzionale)", "se hai un Galaxy Watch, per dati aggiuntivi non esposti da Health Connect"],
          ["Accesso Internet", "per sincronizzare i dati con il backend FitMesh Sync"],
          ["Sync in background", "per inviare dati periodicamente anche quando l'app è chiusa"],
          ["Notifiche", "per ricevere promemoria sync e notifiche di sistema"],
          ["Esclusione ottimizzazione batteria", "per garantire la sync regolare (richiesto su Android 14+)"],
        ]} />
        <p>
          Tutti i permessi sono richiesti esplicitamente e puoi revocarli in qualsiasi momento dalle
          impostazioni del dispositivo o dell'applicazione.
        </p>
      </Section>

      <Section title="9. Sicurezza dei dati">
        <List items={[
          ["Trasporto", "tutti i dati transitano via HTTPS/TLS 1.2+ verso fitmesh.fit"],
          ["Persistenza locale", "la cache locale viene svuotata dopo invio confermato dal server"],
          ["Token di autenticazione", "JWT Supabase salvati in Android Keystore (flutter_secure_storage)"],
          ["Row-Level Security", "ogni utente può leggere/scrivere solo le proprie righe (policy RLS Supabase su tutte le tabelle esposte)"],
          ["Nessun tracker terzo nell'app", "non includiamo SDK di analytics, advertising o profilazione lato app"],
        ]} />
      </Section>

      <Section title="10. I tuoi diritti">
        <p>In conformità al GDPR hai il diritto di:</p>
        <List items={[
          ["Accedere", "richiedere una copia dei tuoi dati salvati sui nostri sistemi"],
          ["Rettificare", "correggere dati inesatti o incompleti"],
          ["Cancellare", "richiedere la cancellazione completa del tuo account e dei dati associati"],
          ["Limitare", "richiedere la limitazione del trattamento in casi specifici"],
          ["Portabilità", "ricevere i tuoi dati in formato JSON strutturato"],
          ["Opporsi", "opporti al trattamento per motivi legittimi"],
          ["Revocare il consenso", "disabilitare i permessi di accesso ai dati di salute in qualsiasi momento (la revoca non pregiudica la liceità del trattamento svolto prima della revoca)"],
        ]} />
        <p>
          Per esercitare questi diritti, scrivici a{" "}
          <a className="text-brand-aqua hover:text-brand-blue underline underline-offset-4" href="mailto:privacy@fitmesh.fit">
            privacy@fitmesh.fit
          </a>
          . Rispondiamo entro 30 giorni come previsto dall'art. 12 GDPR.
        </p>
      </Section>

      <Section title="11. Dati di terze parti (responsabili del trattamento)">
        <p>FitMesh Sync utilizza i seguenti responsabili del trattamento (Data Processors):</p>
        <List items={[
          ["Health Connect (Google LLC)", "fonte dati di salute Android — letti localmente, non comunicati a Google da noi"],
          ["Samsung Health Data SDK (Samsung Electronics)", "fonte dati Galaxy Watch — letti localmente"],
          ["Supabase Inc.", "database PostgreSQL gestito + Auth (Francoforte, DE) — DPA firmato"],
          ["Vercel Inc.", "hosting API serverless (USA, edge globale) — DPA firmato + SCC"],
          ["Resend, Inc.", "delivery email transazionali (USA) — DPA + SCC"],
          ["Google LLC (Firebase Cloud Messaging)", "trasporto notifiche push (USA) — DPA + SCC + DPF"],
          ["Google LLC (Google Sign-In, opzionale)", "autenticazione OAuth (USA) — DPA + SCC + DPF"],
          ["Google LLC (Google Play Billing)", "gestione acquisti in-app — soggetto a Google Play Terms"],
          ["Google Analytics 4 (solo sito web, opt-in)", "analytics anonimi attivati solo dopo consenso esplicito tramite cookie banner"],
        ]} />
        <p>
          Maggiori dettagli sui cookie del sito web nella nostra{" "}
          <a href="/it/cookies" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">Cookie Policy</a>.
        </p>
      </Section>

      <Section title="12. Modifiche">
        <p>
          Possiamo aggiornare questa Privacy Policy di tanto in tanto. Per modifiche significative
          ti notificheremo via email o mostrando un avviso nell'app prima della prossima
          sincronizzazione. La data di ultimo aggiornamento è indicata in cima alla pagina.
        </p>
      </Section>

      <Section title="13. Minori">
        <p>
          FitMesh Sync non è destinata a utenti di età inferiore ai 16 anni (soglia art. 8 GDPR in
          Italia per il consenso digitale). Non raccogliamo consapevolmente dati personali da minori
          di 16 anni senza il consenso del titolare della responsabilità genitoriale.
        </p>
      </Section>

      <Section title="14. Reclami all'Autorità Garante">
        <p>
          Se ritieni che il trattamento dei tuoi dati violi il GDPR, puoi presentare reclamo
          all'Autorità Garante per la Protezione dei Dati Personali italiana:{" "}
          <a className="text-brand-aqua hover:text-brand-blue underline underline-offset-4" href="https://www.garanteprivacy.it/" target="_blank" rel="noopener">
            garanteprivacy.it
          </a>
          . Se sei residente in un altro Stato UE puoi rivolgerti all'autorità nazionale competente.
        </p>
      </Section>

      <Section title="15. Contatti">
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
      <Section title="1. Data Controller">
        <div className="rounded-[14px] border border-divider bg-bg-card/60 p-6">
          <ul className="space-y-1.5 text-sm">
            <li><span className="text-text-muted">Controller:</span> Matteo Pizzi, sole proprietor of FitMesh Sync</li>
            <li><span className="text-text-muted">Privacy contact:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:privacy@fitmesh.fit">privacy@fitmesh.fit</a></li>
            <li><span className="text-text-muted">DPO (Data Protection Officer):</span> not appointed. Processing does not fall under the mandatory cases listed in GDPR Art. 37 (public authority, large-scale systematic monitoring, large-scale special categories). For privacy requests, use the email above.</li>
          </ul>
        </div>
      </Section>

      <Section title="2. Introduction">
        <p>
          FitMesh Sync ("we", "our", "the app") respects your privacy and is committed to
          protecting your personal data. This Privacy Policy explains how we collect, use and
          safeguard health information when you use our mobile application FitMesh Sync
          (<em>com.fitmeshsync.app</em> on Google Play).
        </p>
        <p>
          Legal basis: GDPR Art. 6(1)(b) (performance of a service requested by the user) and
          Art. 9(2)(a) (explicit consent to processing health-related data, granted through the
          Health Connect/Samsung Health authorizations inside the app).
        </p>
      </Section>

      <Section title="3. Information we collect">
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
          ["Account", "email address (Supabase Auth) and device identifier"],
        ]} />
        <Callout>
          Important: this data is read only from health services already present on your device
          and only after you have explicitly granted the required permissions.
        </Callout>
      </Section>

      <Section title="4. How we use the data">
        <p>The collected data is used exclusively to:</p>
        <List items={[
          ["Sync", "ingest and persist your health metrics on our cloud backend"],
          ["Visualization", "display the data on the in-app dashboard"],
          ["Support", "diagnose technical issues when you report them by email"],
          ["Notifications", "deliver configurable reminders (e.g. sync nudges) via Firebase Cloud Messaging"],
        ]} />
        <p className="text-text-primary font-medium">
          We never sell, share or use your data for advertising or marketing.
          No automated profiling that produces legal effects on the user is performed.
        </p>
      </Section>

      <Section title="5. Where data is stored">
        <p>Synced data is sent to the FitMesh Sync backend hosted on:</p>
        <List items={[
          ["Vercel Inc.", "serverless API for fitmesh.fit (preferred region: Europe fra1; some edge functions run closest to the user)"],
          ["Supabase Inc.", "managed PostgreSQL + auth + storage (EU region, eu-central-1 Frankfurt)"],
        ]} />
        <p>
          Data stays on your Android device in a local cache until sync. After delivery is
          confirmed, the local cache is cleared.
        </p>
      </Section>

      <Section title="6. International data transfers (outside the EU)">
        <p>
          The primary database (Supabase Postgres) is hosted in the European Union (Frankfurt,
          Germany). However, some auxiliary services involve a transfer to third countries (in
          particular the United States):
        </p>
        <List items={[
          ["Vercel (US)", "edge runtime and request logging. Transfer governed by Standard Contractual Clauses (SCC) approved by the European Commission (Decision 2021/914) and Data Processing Addendum signed with Vercel"],
          ["Resend (US)", "transactional email delivery (beta signup confirmation, support replies). Transfer governed by SCC + DPA"],
          ["Firebase Cloud Messaging (Google LLC, US)", "push notification transport. Google adheres to SCC + EU-US Data Privacy Framework"],
          ["Google Sign-In (Google LLC, US)", "optional authentication via Google account. Transfer governed by SCC + DPF"],
        ]} />
        <p>
          Before transferring data to the US we performed a Transfer Impact Assessment: data
          transferred is limited and does not include raw biometric identifiers; the SCC include
          suspension clauses in case of government authority requests; chosen vendors adhere to
          the EU-US Data Privacy Framework where available.
        </p>
      </Section>

      <Section title="7. Data retention">
        <List items={[
          ["Health metrics", "kept while the user account is active. Deleted within 30 days of an account-deletion request or confirmed uninstall"],
          ["Application and sync logs", "kept for 90 days for troubleshooting, then automatically purged"],
          ["Contact emails (privacy/support)", "kept for 24 months to ensure support continuity, then deleted"],
          ["Database backups", "7-day rotation on Supabase point-in-time recovery"],
          ["Beta signup data", "kept until public launch, then anonymized or deleted"],
        ]} />
      </Section>

      <Section title="8. Required permissions">
        <p>FitMesh Sync requires the following permissions:</p>
        <List items={[
          ["Health Connect", "to read health data from the Android operating system"],
          ["Samsung Health (optional)", "if you own a Galaxy Watch, for extra data not exposed by Health Connect"],
          ["Internet access", "to sync data with the FitMesh Sync backend"],
          ["Background sync", "to send data periodically even when the app is closed"],
          ["Notifications", "to receive sync reminders and system notices"],
          ["Battery optimization exemption", "to guarantee regular sync (required on Android 14+)"],
        ]} />
        <p>
          All permissions are requested explicitly and you can revoke them at any time from the
          device or app settings.
        </p>
      </Section>

      <Section title="9. Data security">
        <List items={[
          ["Transport", "all data flows over HTTPS/TLS 1.2+ to fitmesh.fit"],
          ["Local persistence", "the local cache is cleared after server-confirmed delivery"],
          ["Auth tokens", "Supabase JWT stored in the Android Keystore (flutter_secure_storage)"],
          ["Row-Level Security", "each user can only read/write their own rows (Supabase RLS policies on every exposed table)"],
          ["No third-party trackers in the app", "no analytics, advertising or profiling SDKs are bundled in the app"],
        ]} />
      </Section>

      <Section title="10. Your rights">
        <p>Under the GDPR you have the right to:</p>
        <List items={[
          ["Access", "request a copy of your data stored on our systems"],
          ["Rectify", "correct inaccurate or incomplete data"],
          ["Delete", "request full deletion of your account and associated data"],
          ["Restrict", "request restriction of processing in specific cases"],
          ["Portability", "receive your data in a structured JSON format"],
          ["Object", "object to processing for legitimate reasons"],
          ["Withdraw consent", "disable health-data permissions at any time (withdrawal does not affect the lawfulness of processing before withdrawal)"],
        ]} />
        <p>
          To exercise these rights, email us at{" "}
          <a className="text-brand-aqua hover:text-brand-blue underline underline-offset-4" href="mailto:privacy@fitmesh.fit">
            privacy@fitmesh.fit
          </a>
          . We reply within 30 days as required by GDPR Art. 12.
        </p>
      </Section>

      <Section title="11. Third-party processors">
        <p>FitMesh Sync uses the following data processors:</p>
        <List items={[
          ["Health Connect (Google LLC)", "Android health data source — read locally, not communicated by us to Google"],
          ["Samsung Health Data SDK (Samsung Electronics)", "Galaxy Watch data source — read locally"],
          ["Supabase Inc.", "managed PostgreSQL + Auth (Frankfurt, DE) — DPA signed"],
          ["Vercel Inc.", "serverless API hosting (US, global edge) — DPA signed + SCC"],
          ["Resend, Inc.", "transactional email delivery (US) — DPA + SCC"],
          ["Google LLC (Firebase Cloud Messaging)", "push notification transport (US) — DPA + SCC + DPF"],
          ["Google LLC (Google Sign-In, optional)", "OAuth authentication (US) — DPA + SCC + DPF"],
          ["Google LLC (Google Play Billing)", "in-app purchase handling — subject to Google Play Terms"],
          ["Google Analytics 4 (website only, opt-in)", "anonymous analytics enabled only after explicit consent via the cookie banner"],
        ]} />
        <p>
          More website-cookie details in our{" "}
          <a href="/en/cookies" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">Cookie Policy</a>.
        </p>
      </Section>

      <Section title="12. Changes">
        <p>
          We may update this Privacy Policy from time to time. For material changes we will notify
          you by email or with an in-app notice before the next sync. The last-updated date is
          shown at the top of this page.
        </p>
      </Section>

      <Section title="13. Minors">
        <p>
          FitMesh Sync is not intended for users under 16 years of age (the digital consent age
          for Italy under GDPR Art. 8). We do not knowingly collect personal data from minors
          under 16 without parental consent.
        </p>
      </Section>

      <Section title="14. Complaints to the supervisory authority">
        <p>
          If you believe the processing of your data violates the GDPR, you may file a complaint
          with your national data protection authority. For Italian residents this is the Garante
          per la Protezione dei Dati Personali (<a className="text-brand-aqua hover:text-brand-blue underline underline-offset-4" href="https://www.garanteprivacy.it/" target="_blank" rel="noopener">garanteprivacy.it</a>).
        </p>
      </Section>

      <Section title="15. Contact">
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
