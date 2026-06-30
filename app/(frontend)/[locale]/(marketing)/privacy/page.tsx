import type { Metadata } from "next";
import { locales, type Locale, getDictionary, localeAlternates } from "@/lib/i18n";
import { LegalPage, Section, List, Callout } from "@/components/legal/LegalLayout";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { LegalJsonLd } from "@/components/seo/LegalJsonLd";
import { TraderIdentity } from "@/components/legal/TraderIdentity";

const SITE_URL = "https://www.fitmesh.fit";
const LAST_UPDATED_IT = "16 giugno 2026";
const LAST_UPDATED_EN = "June 16, 2026";
const LAST_UPDATED_ES = "16 de junio de 2026";
const LAST_UPDATED_DE = "16. Juni 2026";
const LAST_UPDATED_PT = "16 de junho de 2026";
const LAST_UPDATED_FR = "16 juin 2026";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<Locale, string> = {
    it: "Privacy Policy",
    en: "Privacy Policy",
    es: "Política de privacidad",
    de: "Datenschutzerklärung",
    pt: "Política de Privacidade",
    fr: "Politique de confidentialité",
    pl: "Polityka prywatnosci",
    tr: "Gizlilik Politikasi",
    nl: "Privacybeleid",
    ja: "プライバシーポリシー",
    ko: "개인정보 처리방침",
    sv: "Integritetspolicy",
    da: "Privatlivspolitik",
    no: "Personvernerklæring",
    fi: "Tietosuojakäytäntö",
  };
  const desc: Record<Locale, string> = {
    it: "Come FitMesh Sync raccoglie, utilizza e protegge i dati di salute. Conforme GDPR.",
    en: "How FitMesh Sync collects, uses and safeguards health data. GDPR compliant.",
    es: "Cómo FitMesh Sync recopila, utiliza y protege tus datos de salud. Cumple el RGPD.",
    de: "Wie FitMesh Sync Gesundheitsdaten erhebt, nutzt und schützt. DSGVO-konform.",
    pt: "Como o FitMesh Sync coleta, usa e protege dados de saúde. Em conformidade com o GDPR.",
    fr: "Comment FitMesh Sync collecte, utilise et protège vos données de santé. Conforme au RGPD.",
    pl: "Jak FitMesh Sync zbiera, wykorzystuje i chroni dane zdrowotne. Zgodnosc z RODO.",
    tr: "FitMesh Sync'in saglik verilerini nasil topladigini, kullandigini ve korudugunu aciklar. GDPR uyumlu.",
    nl: "Hoe FitMesh Sync gezondheidsgegevens verzamelt, gebruikt en beschermt. AVG-conform.",
    ja: "FitMesh Syncが健康データをどのように収集、使用、保護するか。GDPR準拠。",
    ko: "FitMesh Sync가 건강 데이터를 수집, 사용 및 보호하는 방법. GDPR 준수.",
    sv: "Hur FitMesh Sync samlar in, använder och skyddar hälsodata. GDPR-kompatibel.",
    da: "Hvordan FitMesh Sync indsamler, bruger og beskytter sundhedsdata. GDPR-kompatibel.",
    no: "Hvordan FitMesh Sync samler inn, bruker og beskytter helsedata. GDPR-kompatibel.",
    fi: "Miten FitMesh Sync kerää, käyttää ja suojaa terveystietoja. GDPR-yhteensopiva.",
  };
  const lc = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  return {
    title: titles[lc],
    description: desc[lc],
    alternates: {
      canonical: `${SITE_URL}/${lc}/privacy`,
      languages: localeAlternates((l) => `${SITE_URL}/${l}/privacy`),
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
  const lastUpdated = `${t.legal.last_updated}: ${
    lc === "it" ? LAST_UPDATED_IT :
    lc === "es" ? LAST_UPDATED_ES :
    lc === "de" ? LAST_UPDATED_DE :
    lc === "pt" ? LAST_UPDATED_PT :
    lc === "fr" ? LAST_UPDATED_FR :
    LAST_UPDATED_EN
  }`;

  return (
    <>
      <Breadcrumbs items={[{ name: "Privacy Policy", path: `/${lc}/privacy` }]} locale={lc} />
      <LegalJsonLd locale={lc} path="/privacy" name={t.legal.privacy_title} dateModified="2026-06-16" />
      <LegalPage kicker={t.legal.section} title={t.legal.privacy_title} lastUpdated={lastUpdated}>
        {lc === "it" ? <PrivacyIT /> : lc === "es" ? <PrivacyES /> : lc === "de" ? <PrivacyDE /> : lc === "pt" ? <PrivacyPT /> : lc === "fr" ? <PrivacyFR /> : <PrivacyEN />}
      </LegalPage>
    </>
  );
}

function PrivacyIT() {
  return (
    <>
      <Section title="1. Titolare del trattamento">
        <div className="rounded-[14px] border border-divider bg-bg-card/60 p-6">
          <TraderIdentity locale="it" showContact={false} className="text-sm" />
          <ul className="mt-4 space-y-1.5 text-sm">
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
          ["Metriche di salute", "conservate finché l'account utente è attivo. La cancellazione dell'account viene eseguita automaticamente entro 24 ore dalla richiesta (processo pianificato attivo), che elimina definitivamente i dati di salute associati"],
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
          ["Cancellare", "richiedere la cancellazione completa del tuo account e dei dati associati. La richiesta viene eseguita automaticamente entro 24 ore"],
          ["Limitare", "richiedere la limitazione del trattamento in casi specifici"],
          ["Portabilità", "esportare tutti i tuoi dati in autonomia, in formato JSON strutturato, dalla pagina export disponibile nell'area utente (/app/export)"],
          ["Opporsi", "opporti al trattamento per motivi legittimi"],
          ["Revocare il consenso", "disabilitare i permessi di accesso ai dati di salute in qualsiasi momento (la revoca non pregiudica la liceità del trattamento svolto prima della revoca)"],
        ]} />
        <p>
          Puoi esercitare in autonomia i diritti di portabilità (export dati) e di cancellazione
          direttamente dall'area utente. Per gli altri diritti, o se preferisci, scrivici a{" "}
          <a className="text-brand-aqua hover:text-brand-blue underline underline-offset-4" href="mailto:privacy@fitmesh.fit">
            privacy@fitmesh.fit
          </a>
          . Rispondiamo entro 30 giorni come previsto dall'art. 12 GDPR.
        </p>
      </Section>

      <Section title="11. Dati di terze parti (responsabili del trattamento)">
        <p>FitMesh Sync utilizza i seguenti responsabili del trattamento (Data Processors):</p>
        <List items={[
          ["Health Connect (Google LLC)", "fonte dati di salute Android, letti localmente, non comunicati a Google da noi"],
          ["Samsung Health Data SDK (Samsung Electronics)", "fonte dati Galaxy Watch, letti localmente"],
          ["Supabase Inc.", "database PostgreSQL gestito + Auth (Francoforte, DE), DPA firmato"],
          ["Vercel Inc.", "hosting API serverless (USA, edge globale), DPA firmato + SCC"],
          ["Resend, Inc.", "delivery email transazionali (USA), DPA + SCC"],
          ["Google LLC (Firebase Cloud Messaging)", "trasporto notifiche push (USA), DPA + SCC + DPF"],
          ["Google LLC (Google Sign-In, opzionale)", "autenticazione OAuth (USA), DPA + SCC + DPF"],
          ["Google LLC (Google Play Billing)", "gestione acquisti in-app, soggetto a Google Play Terms"],
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
          <TraderIdentity locale="en" showContact={false} className="text-sm" />
          <ul className="mt-4 space-y-1.5 text-sm">
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
          ["Health metrics", "kept while the user account is active. Account deletion runs automatically within 24 hours of the request (active scheduled job), permanently erasing the associated health data"],
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
          ["Delete", "request full deletion of your account and associated data. The request is executed automatically within 24 hours"],
          ["Restrict", "request restriction of processing in specific cases"],
          ["Portability", "export all of your data yourself, in a structured JSON format, from the export page in the user area (/app/export)"],
          ["Object", "object to processing for legitimate reasons"],
          ["Withdraw consent", "disable health-data permissions at any time (withdrawal does not affect the lawfulness of processing before withdrawal)"],
        ]} />
        <p>
          You can exercise the portability (data export) and deletion rights yourself directly from
          the user area. For the other rights, or if you prefer, email us at{" "}
          <a className="text-brand-aqua hover:text-brand-blue underline underline-offset-4" href="mailto:privacy@fitmesh.fit">
            privacy@fitmesh.fit
          </a>
          . We reply within 30 days as required by GDPR Art. 12.
        </p>
      </Section>

      <Section title="11. Third-party processors">
        <p>FitMesh Sync uses the following data processors:</p>
        <List items={[
          ["Health Connect (Google LLC)", "Android health data source, read locally, not communicated by us to Google"],
          ["Samsung Health Data SDK (Samsung Electronics)", "Galaxy Watch data source, read locally"],
          ["Supabase Inc.", "managed PostgreSQL + Auth (Frankfurt, DE), DPA signed"],
          ["Vercel Inc.", "serverless API hosting (US, global edge), DPA signed + SCC"],
          ["Resend, Inc.", "transactional email delivery (US), DPA + SCC"],
          ["Google LLC (Firebase Cloud Messaging)", "push notification transport (US), DPA + SCC + DPF"],
          ["Google LLC (Google Sign-In, optional)", "OAuth authentication (US), DPA + SCC + DPF"],
          ["Google LLC (Google Play Billing)", "in-app purchase handling, subject to Google Play Terms"],
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

function PrivacyES() {
  return (
    <>
      <Section title="1. Responsable del tratamiento">
        <div className="rounded-[14px] border border-divider bg-bg-card/60 p-6">
          <TraderIdentity locale="es" showContact={false} className="text-sm" />
          <ul className="mt-4 space-y-1.5 text-sm">
            <li><span className="text-text-muted">Contacto de privacidad:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:privacy@fitmesh.fit">privacy@fitmesh.fit</a></li>
            <li><span className="text-text-muted">DPO (Delegado de Protección de Datos):</span> no designado. El tratamiento no entra en los supuestos de designación obligatoria del art. 37 RGPD (autoridad pública, supervisión sistemática a gran escala, categorías especiales a gran escala). Para cualquier consulta sobre privacidad, usa el correo indicado arriba.</li>
          </ul>
        </div>
      </Section>

      <Section title="2. Introducción">
        <p>
          FitMesh Sync ("nosotros", "nuestra", "la app") respeta tu privacidad y se compromete a
          proteger tus datos personales. Esta Política de privacidad explica cómo recopilamos,
          utilizamos y protegemos la información de salud cuando usas nuestra aplicación móvil
          FitMesh Sync (<em>com.fitmeshsync.app</em> en Google Play).
        </p>
        <p>
          Base jurídica del tratamiento: art. 6(1)(b) RGPD (ejecución del servicio solicitado por
          el usuario) y art. 9(2)(a) RGPD (consentimiento explícito para el tratamiento de datos
          relativos a la salud, otorgado mediante los permisos de Health Connect/Samsung Health
          dentro de la app).
        </p>
      </Section>

      <Section title="3. Información que recopilamos">
        <p>
          FitMesh Sync lee los siguientes datos de salud desde tu dispositivo Android a través de
          servicios autorizados (Health Connect, Samsung Health Data SDK):
        </p>
        <List items={[
          ["Actividad física", "pasos, distancia recorrida, calorías quemadas (activas y totales), pisos subidos"],
          ["Frecuencia cardíaca", "media, rango mínimo/máximo, frecuencia cardíaca en reposo, HRV"],
          ["Sueño", "duración total, fases (profundo, REM, ligero, despierto), horarios de inicio y fin"],
          ["Composición corporal", "peso, altura, IMC (si los facilita el usuario)"],
          ["Otros parámetros", "saturación de oxígeno (SpO₂), VO₂ máx, temperatura cutánea, desnivel"],
          ["Sesiones de entrenamiento", "tipo de actividad, duración, distancia, calorías"],
          ["Cuenta", "dirección de correo electrónico (para autenticación mediante Supabase Auth) e identificador de dispositivo"],
        ]} />
        <Callout>
          Importante: estos datos se leen únicamente desde los servicios de salud ya presentes en
          tu dispositivo y solo después de que hayas concedido explícitamente los permisos
          necesarios.
        </Callout>
      </Section>

      <Section title="4. Cómo utilizamos los datos">
        <p>Los datos recopilados se utilizan exclusivamente para:</p>
        <List items={[
          ["Sincronización", "recibir y almacenar tus métricas de salud en nuestro backend en la nube"],
          ["Visualización", "mostrar los datos en el panel de la app"],
          ["Soporte", "diagnosticar problemas técnicos cuando nos los comunicas por correo electrónico"],
          ["Notificaciones", "enviarte recordatorios configurables (p. ej., avisos de sincronización) mediante Firebase Cloud Messaging"],
        ]} />
        <p className="text-text-primary font-medium">
          No vendemos, compartimos ni utilizamos tus datos con fines publicitarios o de marketing.
          No existe ninguna elaboración de perfiles automatizada que produzca efectos jurídicos sobre el usuario.
        </p>
      </Section>

      <Section title="5. Dónde se almacenan los datos">
        <p>
          Los datos sincronizados se envían al backend de FitMesh Sync alojado en:
        </p>
        <List items={[
          ["Vercel Inc.", "alojamiento de la API serverless de fitmesh.fit (región preferida: Europa fra1; algunas funciones edge se ejecutan en la región más cercana al usuario)"],
          ["Supabase Inc.", "base de datos PostgreSQL gestionada + autenticación + almacenamiento (proyecto en región UE, eu-central-1 Fráncfort)"],
        ]} />
        <p>
          Los datos permanecen en tu dispositivo Android en una caché local hasta el momento de la
          sincronización. Tras confirmar la recepción, la caché local se vacía.
        </p>
      </Section>

      <Section title="6. Transferencias internacionales de datos (fuera de la UE)">
        <p>
          La base de datos principal (Supabase Postgres) está alojada en la Unión Europea
          (Fráncfort, Alemania). Sin embargo, algunos servicios auxiliares implican una
          transferencia a terceros países (en particular, Estados Unidos):
        </p>
        <List items={[
          ["Vercel (EE. UU.)", "edge runtime y registro de solicitudes. Transferencia basada en las Cláusulas Contractuales Tipo (CCT) aprobadas por la Comisión Europea (Decisión 2021/914) y en el Addendum de Procesamiento de Datos firmado con Vercel"],
          ["Resend (EE. UU.)", "envío de correos transaccionales (confirmación de registro beta, comunicaciones de soporte). Transferencia basada en CCT + DPA"],
          ["Firebase Cloud Messaging (Google LLC, EE. UU.)", "transporte de notificaciones push. Google se adhiere a las CCT + Marco de Privacidad de Datos UE-EE. UU."],
          ["Google Sign-In (Google LLC, EE. UU.)", "autenticación opcional mediante cuenta de Google. Transferencia basada en CCT + DPF"],
        ]} />
        <p>
          Antes de transferir datos a EE. UU. realizamos una Evaluación de Impacto de la
          Transferencia: los datos transferidos son limitados y no incluyen identificadores
          biométricos puros; las CCT incluyen cláusulas de suspensión en caso de solicitudes de
          autoridades gubernamentales; los proveedores elegidos se adhieren al Marco de Privacidad
          de Datos UE-EE. UU. cuando está disponible.
        </p>
      </Section>

      <Section title="7. Conservación de los datos">
        <List items={[
          ["Métricas de salud", "conservadas mientras la cuenta del usuario esté activa. La eliminación de la cuenta se ejecuta automáticamente en un plazo de 24 horas desde la solicitud (proceso programado activo), que borra de forma definitiva los datos de salud asociados"],
          ["Registros de aplicación y sincronización", "conservados 90 días con fines de diagnóstico y, después, eliminados automáticamente"],
          ["Correos de contacto (privacidad/soporte)", "conservados 24 meses para garantizar la continuidad del soporte y, después, eliminados"],
          ["Copias de seguridad de la base de datos", "rotación de 7 días en la recuperación point-in-time de Supabase"],
          ["Datos de registro beta", "conservados hasta el lanzamiento público y, después, anonimizados o eliminados"],
        ]} />
      </Section>

      <Section title="8. Permisos requeridos">
        <p>FitMesh Sync requiere los siguientes permisos:</p>
        <List items={[
          ["Health Connect", "para leer los datos de salud del sistema operativo Android"],
          ["Samsung Health (opcional)", "si tienes un Galaxy Watch, para obtener datos adicionales que Health Connect no expone"],
          ["Acceso a Internet", "para sincronizar los datos con el backend de FitMesh Sync"],
          ["Sincronización en segundo plano", "para enviar datos periódicamente incluso cuando la app está cerrada"],
          ["Notificaciones", "para recibir recordatorios de sincronización y avisos del sistema"],
          ["Exención de optimización de batería", "para garantizar la sincronización regular (obligatorio en Android 14+)"],
        ]} />
        <p>
          Todos los permisos se solicitan de forma explícita y puedes revocarlos en cualquier
          momento desde los ajustes del dispositivo o de la aplicación.
        </p>
      </Section>

      <Section title="9. Seguridad de los datos">
        <List items={[
          ["Transporte", "todos los datos se transmiten mediante HTTPS/TLS 1.2+ hacia fitmesh.fit"],
          ["Persistencia local", "la caché local se vacía tras la confirmación de envío por parte del servidor"],
          ["Tokens de autenticación", "JWT de Supabase almacenados en el Android Keystore (flutter_secure_storage)"],
          ["Seguridad a nivel de fila (RLS)", "cada usuario solo puede leer y escribir sus propias filas (políticas RLS de Supabase en todas las tablas expuestas)"],
          ["Sin rastreadores de terceros en la app", "no incluimos SDKs de analítica, publicidad ni elaboración de perfiles en la app"],
        ]} />
      </Section>

      <Section title="10. Tus derechos">
        <p>De conformidad con el RGPD, tienes derecho a:</p>
        <List items={[
          ["Acceder", "solicitar una copia de tus datos almacenados en nuestros sistemas"],
          ["Rectificar", "corregir datos inexactos o incompletos"],
          ["Suprimir", "solicitar la eliminación completa de tu cuenta y de los datos asociados. La solicitud se ejecuta automáticamente en un plazo de 24 horas"],
          ["Limitar", "solicitar la limitación del tratamiento en casos específicos"],
          ["Portabilidad", "exportar todos tus datos por ti mismo, en formato JSON estructurado, desde la página de exportación disponible en el área de usuario (/app/export)"],
          ["Oponerte", "oponerte al tratamiento por motivos legítimos"],
          ["Retirar el consentimiento", "deshabilitar los permisos de acceso a los datos de salud en cualquier momento (la retirada no afecta a la licitud del tratamiento realizado antes de la misma)"],
        ]} />
        <p>
          Puedes ejercer por ti mismo los derechos de portabilidad (exportación de datos) y de
          supresión directamente desde el área de usuario. Para los demás derechos, o si lo
          prefieres, escríbenos a{" "}
          <a className="text-brand-aqua hover:text-brand-blue underline underline-offset-4" href="mailto:privacy@fitmesh.fit">
            privacy@fitmesh.fit
          </a>
          . Respondemos en un plazo de 30 días, conforme al art. 12 RGPD.
        </p>
      </Section>

      <Section title="11. Terceros encargados del tratamiento">
        <p>FitMesh Sync utiliza los siguientes encargados del tratamiento:</p>
        <List items={[
          ["Health Connect (Google LLC)", "fuente de datos de salud Android, leídos localmente, no comunicados por nosotros a Google"],
          ["Samsung Health Data SDK (Samsung Electronics)", "fuente de datos de Galaxy Watch, leídos localmente"],
          ["Supabase Inc.", "PostgreSQL gestionado + Auth (Fráncfort, DE), DPA firmado"],
          ["Vercel Inc.", "alojamiento de API serverless (EE. UU., edge global), DPA firmado + CCT"],
          ["Resend, Inc.", "envío de correos transaccionales (EE. UU.), DPA + CCT"],
          ["Google LLC (Firebase Cloud Messaging)", "transporte de notificaciones push (EE. UU.), DPA + CCT + DPF"],
          ["Google LLC (Google Sign-In, opcional)", "autenticación OAuth (EE. UU.), DPA + CCT + DPF"],
          ["Google LLC (Google Play Billing)", "gestión de compras en la app, sujeto a los Términos de Google Play"],
          ["Google Analytics 4 (solo sitio web, opt-in)", "analítica anónima activada únicamente tras el consentimiento explícito mediante el banner de cookies"],
        ]} />
        <p>
          Más detalles sobre las cookies del sitio web en nuestra{" "}
          <a href="/es/cookies" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">Política de cookies</a>.
        </p>
      </Section>

      <Section title="12. Cambios">
        <p>
          Podemos actualizar esta Política de privacidad de vez en cuando. Para cambios
          significativos, te notificaremos por correo electrónico o mediante un aviso en la app
          antes de la próxima sincronización. La fecha de última actualización aparece en la parte
          superior de esta página.
        </p>
      </Section>

      <Section title="13. Menores">
        <p>
          FitMesh Sync no está destinada a usuarios menores de 16 años (edad mínima de consentimiento
          digital según el art. 8 RGPD). No recopilamos conscientemente datos personales de menores
          de 16 años sin el consentimiento de quien ejerza la patria potestad o tutela.
        </p>
      </Section>

      <Section title="14. Reclamaciones ante la autoridad de control">
        <p>
          Si consideras que el tratamiento de tus datos infringe el RGPD, puedes presentar una
          reclamación ante la autoridad de protección de datos de tu país. Para residentes en
          Italia, la autoridad competente es el Garante per la Protezione dei Dati Personali{" "}
          <a className="text-brand-aqua hover:text-brand-blue underline underline-offset-4" href="https://www.garanteprivacy.it/" target="_blank" rel="noopener">
            garanteprivacy.it
          </a>
          . Si resides en otro Estado miembro de la UE, puedes dirigirte a tu autoridad nacional
          competente.
        </p>
      </Section>

      <Section title="15. Contacto">
        <div className="rounded-[14px] border border-divider bg-bg-card/60 p-6">
          <ul className="space-y-1.5 text-sm">
            <li><span className="text-text-muted">Privacidad:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:privacy@fitmesh.fit">privacy@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Soporte:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:support@fitmesh.fit">support@fitmesh.fit</a></li>
            <li><span className="text-text-muted">General:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:hello@fitmesh.fit">hello@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Sitio web:</span> <a className="text-brand-aqua hover:text-brand-blue" href="https://www.fitmesh.fit">www.fitmesh.fit</a></li>
          </ul>
        </div>
      </Section>
    </>
  );
}

function PrivacyDE() {
  return (
    <>
      <Section title="1. Verantwortlicher">
        <div className="rounded-[14px] border border-divider bg-bg-card/60 p-6">
          <TraderIdentity locale="de" showContact={false} className="text-sm" />
          <ul className="mt-4 space-y-1.5 text-sm">
            <li><span className="text-text-muted">Datenschutzkontakt:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:privacy@fitmesh.fit">privacy@fitmesh.fit</a></li>
            <li><span className="text-text-muted">DSB (Datenschutzbeauftragter):</span> nicht benannt. Die Verarbeitung fällt nicht unter die Pflichtfälle des Art. 37 DSGVO (Behörde, systematische Überwachung im großen Maßstab, umfangreiche Verarbeitung besonderer Kategorien). Für Datenschutzanfragen nutzen Sie bitte die obige E-Mail-Adresse.</li>
          </ul>
        </div>
      </Section>

      <Section title="2. Einleitung">
        <p>
          FitMesh Sync ("wir", "unser", "die App") respektiert Ihre Privatsphäre und verpflichtet sich
          zum Schutz Ihrer personenbezogenen Daten. Diese Datenschutzerklärung erläutert, wie wir
          Gesundheitsdaten erheben, verwenden und schützen, wenn Sie unsere mobile Anwendung
          FitMesh Sync (<em>com.fitmeshsync.app</em> auf Google Play) nutzen.
        </p>
        <p>
          Rechtsgrundlage der Verarbeitung: Art. 6(1)(b) DSGVO (Erfüllung des vom Nutzer
          angeforderten Dienstes) und Art. 9(2)(a) DSGVO (ausdrückliche Einwilligung zur
          Verarbeitung gesundheitsbezogener Daten, erteilt über die Health Connect/Samsung Health
          Berechtigungen innerhalb der App).
        </p>
      </Section>

      <Section title="3. Erhobene Daten">
        <p>
          FitMesh Sync liest folgende Gesundheitsdaten von Ihrem Android-Gerät über autorisierte
          Dienste (Health Connect, Samsung Health Data SDK):
        </p>
        <List items={[
          ["Körperliche Aktivität", "Schritte, zurückgelegte Distanz, verbrannte Kalorien (aktiv und gesamt), erklommene Stockwerke"],
          ["Herzfrequenz", "Durchschnitt, Minimum/Maximum, Ruheherzfrequenz, HRV"],
          ["Schlaf", "Gesamtdauer, Schlafphasen (Tiefschlaf, REM, Leichtschlaf, wach), Einschlaf- und Aufwachzeiten"],
          ["Körperzusammensetzung", "Gewicht, Größe, BMI (sofern vom Nutzer angegeben)"],
          ["Weitere Parameter", "Sauerstoffsättigung (SpO₂), VO₂ max, Hauttemperatur, Höhenunterschied"],
          ["Trainingseinheiten", "Aktivitätstyp, Dauer, Distanz, Kalorien"],
          ["Konto", "E-Mail-Adresse (zur Authentifizierung über Supabase Auth) und Gerätekennung"],
        ]} />
        <Callout>
          Wichtig: Diese Daten werden ausschließlich aus bereits auf Ihrem Gerät vorhandenen
          Gesundheitsdiensten gelesen und nur nachdem Sie die erforderlichen Berechtigungen
          ausdrücklich erteilt haben.
        </Callout>
      </Section>

      <Section title="4. Verwendung der Daten">
        <p>Die erhobenen Daten werden ausschließlich verwendet für:</p>
        <List items={[
          ["Synchronisierung", "Empfang und Speicherung Ihrer Gesundheitsmetriken in unserem Cloud-Backend"],
          ["Visualisierung", "Darstellung der Daten auf der Dashboard-Ansicht der App"],
          ["Support", "Diagnose technischer Probleme, wenn Sie uns diese per E-Mail melden"],
          ["Benachrichtigungen", "Versand konfigurierbarer Erinnerungen (z. B. Sync-Hinweise) über Firebase Cloud Messaging"],
        ]} />
        <p className="text-text-primary font-medium">
          Wir verkaufen, teilen oder verwenden Ihre Daten nicht für Werbung oder Marketing.
          Es findet keine automatisierte Profilbildung statt, die rechtliche Wirkung für den Nutzer entfaltet.
        </p>
      </Section>

      <Section title="5. Datenspeicherung">
        <p>
          Synchronisierte Daten werden an das FitMesh Sync-Backend gesendet, das gehostet wird bei:
        </p>
        <List items={[
          ["Vercel Inc.", "Hosting der serverlosen API für fitmesh.fit (bevorzugte Region: Europa fra1; einige Edge-Funktionen laufen in der dem Nutzer nächstgelegenen Region)"],
          ["Supabase Inc.", "verwaltete PostgreSQL-Datenbank + Authentifizierung + Speicher (Projekt in EU-Region, eu-central-1 Frankfurt)"],
        ]} />
        <p>
          Die Daten verbleiben bis zur Synchronisierung in einem lokalen Cache auf Ihrem
          Android-Gerät. Nach Empfangsbestätigung wird der lokale Cache geleert.
        </p>
      </Section>

      <Section title="6. Internationale Datenübermittlungen (außerhalb der EU)">
        <p>
          Die primäre Datenbank (Supabase Postgres) wird in der Europäischen Union (Frankfurt,
          Deutschland) gehostet. Einige Zusatzdienste bedingen jedoch eine Übermittlung in
          Drittländer, insbesondere in die USA:
        </p>
        <List items={[
          ["Vercel (USA)", "Edge-Runtime und Anfrage-Logging. Übermittlung auf Grundlage der von der Europäischen Kommission genehmigten Standardvertragsklauseln (SCC, Beschluss 2021/914) und eines mit Vercel unterzeichneten Datenverarbeitungsvertrags (DPA)"],
          ["Resend (USA)", "Versand transaktionaler E-Mails (Beta-Anmeldebestätigung, Support-Kommunikation). Übermittlung auf Grundlage von SCC + DPA"],
          ["Firebase Cloud Messaging (Google LLC, USA)", "Push-Benachrichtigungstransport. Google hält SCC und das EU-US Data Privacy Framework ein"],
          ["Google Sign-In (Google LLC, USA)", "optionale Authentifizierung über Google-Konto. Übermittlung auf Grundlage von SCC + DPF"],
        ]} />
        <p>
          Vor der Übermittlung von Daten in die USA haben wir eine Übertragungsfolgenabschätzung
          (Transfer Impact Assessment) durchgeführt: die übermittelten Daten sind begrenzt und
          enthalten keine reinen biometrischen Identifikatoren; die SCC enthalten
          Aussetzungsklauseln bei Anfragen staatlicher Behörden; die gewählten Anbieter halten das
          EU-US Data Privacy Framework ein, soweit verfügbar.
        </p>
      </Section>

      <Section title="7. Datenspeicherdauer (Retention)">
        <List items={[
          ["Gesundheitsmetriken", "gespeichert solange das Nutzerkonto aktiv ist. Die Kontolöschung erfolgt automatisch innerhalb von 24 Stunden nach Anfrage (aktiver geplanter Prozess) und löscht die zugehörigen Gesundheitsdaten endgültig"],
          ["Anwendungs- und Sync-Logs", "90 Tage zur Fehlerbehebung aufbewahrt, danach automatisch gelöscht"],
          ["Kontakt-E-Mails (Datenschutz/Support)", "24 Monate zur Sicherstellung des Support-Kontinuums aufbewahrt, danach gelöscht"],
          ["Datenbank-Backups", "7-Tage-Rotation über Supabase Point-in-Time-Recovery"],
          ["Beta-Anmeldedaten", "bis zum öffentlichen Launch aufbewahrt, danach anonymisiert oder gelöscht"],
        ]} />
      </Section>

      <Section title="8. Erforderliche Berechtigungen">
        <p>FitMesh Sync benötigt folgende Berechtigungen:</p>
        <List items={[
          ["Health Connect", "zum Lesen von Gesundheitsdaten aus dem Android-Betriebssystem"],
          ["Samsung Health (optional)", "bei Besitz einer Galaxy Watch, für zusätzliche Daten, die Health Connect nicht bereitstellt"],
          ["Internetzugang", "zur Synchronisierung der Daten mit dem FitMesh Sync-Backend"],
          ["Hintergrund-Sync", "zum periodischen Senden von Daten auch wenn die App geschlossen ist"],
          ["Benachrichtigungen", "zum Empfang von Sync-Erinnerungen und Systemmeldungen"],
          ["Ausnahme von der Akkuoptimierung", "zur Gewährleistung regelmäßiger Synchronisierung (erforderlich ab Android 14+)"],
        ]} />
        <p>
          Alle Berechtigungen werden ausdrücklich angefordert und können jederzeit in den
          Geräte- oder App-Einstellungen widerrufen werden.
        </p>
      </Section>

      <Section title="9. Datensicherheit">
        <List items={[
          ["Übertragung", "alle Daten werden über HTTPS/TLS 1.2+ an fitmesh.fit übertragen"],
          ["Lokale Speicherung", "der lokale Cache wird nach vom Server bestätigter Zustellung geleert"],
          ["Authentifizierungs-Token", "Supabase-JWT im Android Keystore gespeichert (flutter_secure_storage)"],
          ["Row-Level Security", "jeder Nutzer kann ausschließlich seine eigenen Datensätze lesen und schreiben (Supabase-RLS-Richtlinien auf allen exponierten Tabellen)"],
          ["Keine Drittanbieter-Tracker in der App", "es sind keine Analytics-, Werbe- oder Profilierungs-SDKs in die App integriert"],
        ]} />
      </Section>

      <Section title="10. Ihre Rechte">
        <p>Gemäß der DSGVO haben Sie das Recht:</p>
        <List items={[
          ["Auskunft", "eine Kopie Ihrer bei uns gespeicherten Daten anzufordern"],
          ["Berichtigung", "unrichtige oder unvollständige Daten zu korrigieren"],
          ["Löschung", "die vollständige Löschung Ihres Kontos und der zugehörigen Daten zu verlangen. Die Anfrage wird automatisch innerhalb von 24 Stunden ausgeführt"],
          ["Einschränkung", "in bestimmten Fällen die Einschränkung der Verarbeitung zu verlangen"],
          ["Datenübertragbarkeit", "alle Ihre Daten selbst in strukturiertem JSON-Format aus der Export-Seite im Nutzerbereich (/app/export) zu exportieren"],
          ["Widerspruch", "der Verarbeitung aus legitimen Gründen zu widersprechen"],
          ["Widerruf der Einwilligung", "die Berechtigungen zum Zugriff auf Gesundheitsdaten jederzeit zu deaktivieren (der Widerruf berührt nicht die Rechtmäßigkeit der vor dem Widerruf erfolgten Verarbeitung)"],
        ]} />
        <p>
          Das Recht auf Datenübertragbarkeit (Datenexport) und auf Löschung können Sie direkt
          im Nutzerbereich selbst ausüben. Für die übrigen Rechte oder falls Sie es vorziehen,
          schreiben Sie uns an{" "}
          <a className="text-brand-aqua hover:text-brand-blue underline underline-offset-4" href="mailto:privacy@fitmesh.fit">
            privacy@fitmesh.fit
          </a>
          . Wir antworten innerhalb von 30 Tagen gemäß Art. 12 DSGVO.
        </p>
      </Section>

      <Section title="11. Drittanbieter (Auftragsverarbeiter)">
        <p>FitMesh Sync nutzt folgende Auftragsverarbeiter:</p>
        <List items={[
          ["Health Connect (Google LLC)", "Android-Gesundheitsdatenquelle, lokal gelesen, nicht von uns an Google übermittelt"],
          ["Samsung Health Data SDK (Samsung Electronics)", "Galaxy Watch-Datenquelle, lokal gelesen"],
          ["Supabase Inc.", "verwaltetes PostgreSQL + Auth (Frankfurt, DE), DPA unterzeichnet"],
          ["Vercel Inc.", "serverlose API-Hosting (USA, globale Edge), DPA unterzeichnet + SCC"],
          ["Resend, Inc.", "transaktionale E-Mail-Zustellung (USA), DPA + SCC"],
          ["Google LLC (Firebase Cloud Messaging)", "Push-Benachrichtigungstransport (USA), DPA + SCC + DPF"],
          ["Google LLC (Google Sign-In, optional)", "OAuth-Authentifizierung (USA), DPA + SCC + DPF"],
          ["Google LLC (Google Play Billing)", "Verwaltung von In-App-Käufen, unterliegt den Google Play-Nutzungsbedingungen"],
          ["Google Analytics 4 (nur Website, Opt-in)", "anonyme Analyse, nur nach ausdrücklicher Einwilligung über das Cookie-Banner aktiviert"],
        ]} />
        <p>
          Weitere Details zu den Website-Cookies finden Sie in unserer{" "}
          <a href="/de/cookies" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">Cookie-Richtlinie</a>.
        </p>
      </Section>

      <Section title="12. Änderungen">
        <p>
          Diese Datenschutzerklärung kann von Zeit zu Zeit aktualisiert werden. Bei wesentlichen
          Änderungen werden wir Sie per E-Mail oder über einen Hinweis in der App vor der
          nächsten Synchronisierung informieren. Das Datum der letzten Aktualisierung ist oben
          auf dieser Seite angegeben.
        </p>
      </Section>

      <Section title="13. Minderjährige">
        <p>
          FitMesh Sync richtet sich nicht an Nutzer unter 16 Jahren (Altersgrenze gemäß Art. 8
          DSGVO für die digitale Einwilligung). Wir erheben wissentlich keine personenbezogenen
          Daten von Minderjährigen unter 16 Jahren ohne Einwilligung der Person mit elterlicher
          Verantwortung.
        </p>
      </Section>

      <Section title="14. Beschwerden bei der Aufsichtsbehörde">
        <p>
          Wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer Daten gegen die DSGVO verstößt,
          können Sie eine Beschwerde bei der zuständigen Datenschutzaufsichtsbehörde einreichen.
          Für Nutzer mit Wohnsitz in Italien ist dies der Garante per la Protezione dei Dati
          Personali:{" "}
          <a className="text-brand-aqua hover:text-brand-blue underline underline-offset-4" href="https://www.garanteprivacy.it/" target="_blank" rel="noopener">
            garanteprivacy.it
          </a>
          . Wohnen Sie in einem anderen EU-Mitgliedstaat, können Sie sich an Ihre nationale
          zuständige Behörde wenden.
        </p>
      </Section>

      <Section title="15. Kontakt">
        <div className="rounded-[14px] border border-divider bg-bg-card/60 p-6">
          <ul className="space-y-1.5 text-sm">
            <li><span className="text-text-muted">Datenschutz:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:privacy@fitmesh.fit">privacy@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Support:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:support@fitmesh.fit">support@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Allgemein:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:hello@fitmesh.fit">hello@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Website:</span> <a className="text-brand-aqua hover:text-brand-blue" href="https://www.fitmesh.fit">www.fitmesh.fit</a></li>
          </ul>
        </div>
      </Section>
    </>
  );
}

function PrivacyPT() {
  return (
    <>
      <Section title="1. Controlador de dados">
        <div className="rounded-[14px] border border-divider bg-bg-card/60 p-6">
          <TraderIdentity locale="pt" showContact={false} className="text-sm" />
          <ul className="mt-4 space-y-1.5 text-sm">
            <li><span className="text-text-muted">Contato de privacidade:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:privacy@fitmesh.fit">privacy@fitmesh.fit</a></li>
            <li><span className="text-text-muted">DPO (Encarregado de Proteção de Dados):</span> não designado. O tratamento não se enquadra nos casos de designação obrigatória previstos no art. 37 do GDPR (autoridade pública, monitoramento sistemático em larga escala, categorias especiais em larga escala). Para qualquer solicitação sobre privacidade, use o e-mail acima.</li>
          </ul>
        </div>
      </Section>

      <Section title="2. Introdução">
        <p>
          FitMesh Sync ("nós", "nosso", "o app") respeita sua privacidade e se compromete a proteger
          seus dados pessoais. Esta Política de Privacidade explica como coletamos, usamos e
          protegemos informações de saúde quando você usa nosso aplicativo móvel FitMesh Sync
          (<em>com.fitmeshsync.app</em> no Google Play).
        </p>
        <p>
          Base legal do tratamento: art. 6(1)(b) do GDPR (execução do serviço solicitado pelo
          usuário) e art. 9(2)(a) do GDPR (consentimento explícito para o tratamento de dados
          relativos à saúde, concedido por meio das permissões do Health Connect/Samsung Health
          dentro do app).
        </p>
      </Section>

      <Section title="3. Dados que coletamos">
        <p>
          FitMesh Sync lê os seguintes dados de saúde do seu dispositivo Android por meio de
          serviços autorizados (Health Connect, Samsung Health Data SDK):
        </p>
        <List items={[
          ["Atividade física", "passos, distância percorrida, calorias queimadas (ativas e totais), andares subidos"],
          ["Frequência cardíaca", "média, mínimo/máximo, frequência cardíaca em repouso, HRV"],
          ["Sono", "duração total, fases (profundo, REM, leve, acordado), horários de início e fim"],
          ["Composição corporal", "peso, altura, IMC (quando fornecidos pelo usuário)"],
          ["Outros parâmetros", "saturação de oxigênio (SpO₂), VO₂ máx, temperatura da pele, ganho de elevação"],
          ["Sessões de treino", "tipo de atividade, duração, distância, calorias"],
          ["Conta", "endereço de e-mail (para autenticação via Supabase Auth) e identificador do dispositivo"],
        ]} />
        <Callout>
          Importante: esses dados são lidos apenas dos serviços de saúde já presentes no seu
          dispositivo e somente após você ter concedido explicitamente as permissões necessárias.
        </Callout>
      </Section>

      <Section title="4. Como usamos os dados">
        <p>Os dados coletados são usados exclusivamente para:</p>
        <List items={[
          ["Sincronização", "receber e armazenar suas métricas de saúde no nosso backend na nuvem"],
          ["Visualização", "exibir os dados no painel do app"],
          ["Suporte", "diagnosticar problemas técnicos quando você os reporta por e-mail"],
          ["Notificações", "enviar lembretes configuráveis (por exemplo, avisos de sincronização) via Firebase Cloud Messaging"],
        ]} />
        <p className="text-text-primary font-medium">
          Não vendemos, compartilhamos nem usamos seus dados para publicidade ou marketing.
          Não realizamos nenhuma criação de perfis automatizada que produza efeitos jurídicos sobre o usuário.
        </p>
      </Section>

      <Section title="5. Onde os dados são armazenados">
        <p>
          Os dados sincronizados são enviados ao backend do FitMesh Sync hospedado em:
        </p>
        <List items={[
          ["Vercel Inc.", "hospedagem da API serverless de fitmesh.fit (região preferencial: Europa fra1; algumas funções edge são executadas na região mais próxima do usuário)"],
          ["Supabase Inc.", "banco de dados PostgreSQL gerenciado + autenticação + armazenamento (projeto na região da UE, eu-central-1 Frankfurt)"],
        ]} />
        <p>
          Os dados permanecem no seu dispositivo Android em um cache local até o momento da
          sincronização. Após a confirmação de recebimento, o cache local é limpo.
        </p>
      </Section>

      <Section title="6. Transferências internacionais de dados (fora da UE)">
        <p>
          O banco de dados principal (Supabase Postgres) está hospedado na União Europeia
          (Frankfurt, Alemanha). No entanto, alguns serviços auxiliares envolvem transferência
          para países terceiros, em especial os Estados Unidos:
        </p>
        <List items={[
          ["Vercel (EUA)", "edge runtime e registro de requisições. Transferência baseada nas Cláusulas Contratuais Padrão (SCC) aprovadas pela Comissão Europeia (Decisão 2021/914) e no Adendo de Processamento de Dados assinado com a Vercel"],
          ["Resend (EUA)", "envio de e-mails transacionais (confirmação de cadastro beta, comunicações de suporte). Transferência baseada em SCC + DPA"],
          ["Firebase Cloud Messaging (Google LLC, EUA)", "transporte de notificações push. O Google adere às SCC e ao EU-US Data Privacy Framework"],
          ["Google Sign-In (Google LLC, EUA)", "autenticação opcional via conta Google. Transferência baseada em SCC + DPF"],
        ]} />
        <p>
          Antes de transferir dados para os EUA, realizamos uma Avaliação de Impacto da
          Transferência: os dados transferidos são limitados e não incluem identificadores
          biométricos puros; as SCC incluem cláusulas de suspensão em caso de solicitações de
          autoridades governamentais; os fornecedores escolhidos aderem ao EU-US Data Privacy
          Framework quando disponível.
        </p>
      </Section>

      <Section title="7. Retenção de dados">
        <List items={[
          ["Métricas de saúde", "mantidas enquanto a conta do usuário estiver ativa. A exclusão da conta é executada automaticamente em até 24 horas após a solicitação (processo agendado ativo), eliminando definitivamente os dados de saúde associados"],
          ["Logs de aplicação e sincronização", "mantidos por 90 dias para fins de diagnóstico, depois excluídos automaticamente"],
          ["E-mails de contato (privacidade/suporte)", "mantidos por 24 meses para garantir a continuidade do suporte, depois excluídos"],
          ["Backups do banco de dados", "rotação de 7 dias via recuperação point-in-time do Supabase"],
          ["Dados de cadastro beta", "mantidos até o lançamento público, depois anonimizados ou excluídos"],
        ]} />
      </Section>

      <Section title="8. Permissões necessárias">
        <p>FitMesh Sync requer as seguintes permissões:</p>
        <List items={[
          ["Health Connect", "para ler dados de saúde do sistema operacional Android"],
          ["Samsung Health (opcional)", "se você possui uma Galaxy Watch, para dados adicionais não disponibilizados pelo Health Connect"],
          ["Acesso à internet", "para sincronizar os dados com o backend do FitMesh Sync"],
          ["Sincronização em segundo plano", "para enviar dados periodicamente mesmo quando o app está fechado"],
          ["Notificações", "para receber lembretes de sincronização e avisos do sistema"],
          ["Isenção de otimização de bateria", "para garantir a sincronização regular (necessário no Android 14+)"],
        ]} />
        <p>
          Todas as permissões são solicitadas explicitamente e você pode revogá-las a qualquer
          momento nas configurações do dispositivo ou do aplicativo.
        </p>
      </Section>

      <Section title="9. Segurança dos dados">
        <List items={[
          ["Transporte", "todos os dados trafegam via HTTPS/TLS 1.2+ para fitmesh.fit"],
          ["Persistência local", "o cache local é limpo após a entrega confirmada pelo servidor"],
          ["Tokens de autenticação", "JWT do Supabase armazenados no Android Keystore (flutter_secure_storage)"],
          ["Row-Level Security", "cada usuário pode ler e gravar apenas seus próprios registros (políticas RLS do Supabase em todas as tabelas expostas)"],
          ["Sem rastreadores de terceiros no app", "não incluímos SDKs de análise, publicidade ou criação de perfis no app"],
        ]} />
      </Section>

      <Section title="10. Seus direitos">
        <p>De acordo com o GDPR, você tem o direito de:</p>
        <List items={[
          ["Acesso", "solicitar uma cópia dos seus dados armazenados nos nossos sistemas"],
          ["Retificação", "corrigir dados inexatos ou incompletos"],
          ["Exclusão", "solicitar a exclusão completa da sua conta e dos dados associados. A solicitação é executada automaticamente em até 24 horas"],
          ["Limitação", "solicitar a limitação do tratamento em casos específicos"],
          ["Portabilidade", "exportar todos os seus dados por conta própria, em formato JSON estruturado, na página de exportação disponível na área do usuário (/app/export)"],
          ["Oposição", "se opor ao tratamento por motivos legítimos"],
          ["Retirar o consentimento", "desativar as permissões de acesso a dados de saúde a qualquer momento (a retirada não afeta a licitude do tratamento realizado antes dela)"],
        ]} />
        <p>
          Você pode exercer por conta própria os direitos de portabilidade (exportação de dados)
          e exclusão diretamente na área do usuário. Para os demais direitos, ou se preferir,
          escreva para{" "}
          <a className="text-brand-aqua hover:text-brand-blue underline underline-offset-4" href="mailto:privacy@fitmesh.fit">
            privacy@fitmesh.fit
          </a>
          . Respondemos em até 30 dias conforme exigido pelo art. 12 do GDPR.
        </p>
      </Section>

      <Section title="11. Terceiros (operadores de dados)">
        <p>FitMesh Sync utiliza os seguintes operadores de dados:</p>
        <List items={[
          ["Health Connect (Google LLC)", "fonte de dados de saúde Android, lidos localmente, não comunicados por nós ao Google"],
          ["Samsung Health Data SDK (Samsung Electronics)", "fonte de dados da Galaxy Watch, lidos localmente"],
          ["Supabase Inc.", "PostgreSQL gerenciado + Auth (Frankfurt, DE), DPA assinado"],
          ["Vercel Inc.", "hospedagem de API serverless (EUA, edge global), DPA assinado + SCC"],
          ["Resend, Inc.", "entrega de e-mails transacionais (EUA), DPA + SCC"],
          ["Google LLC (Firebase Cloud Messaging)", "transporte de notificações push (EUA), DPA + SCC + DPF"],
          ["Google LLC (Google Sign-In, opcional)", "autenticação OAuth (EUA), DPA + SCC + DPF"],
          ["Google LLC (Google Play Billing)", "gerenciamento de compras no app, sujeito aos Termos do Google Play"],
          ["Google Analytics 4 (somente site, opt-in)", "análise anônima ativada apenas após consentimento explícito via banner de cookies"],
        ]} />
        <p>
          Mais detalhes sobre os cookies do site em nossa{" "}
          <a href="/pt/cookies" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">Política de Cookies</a>.
        </p>
      </Section>

      <Section title="12. Alterações">
        <p>
          Podemos atualizar esta Política de Privacidade periodicamente. Para alterações
          significativas, notificaremos você por e-mail ou com um aviso no app antes da próxima
          sincronização. A data da última atualização é indicada no topo desta página.
        </p>
      </Section>

      <Section title="13. Menores">
        <p>
          FitMesh Sync não se destina a usuários com menos de 16 anos (idade mínima para
          consentimento digital segundo o art. 8 do GDPR). Não coletamos conscientemente dados
          pessoais de menores de 16 anos sem o consentimento de quem detém a responsabilidade
          parental.
        </p>
      </Section>

      <Section title="14. Reclamações à autoridade supervisora">
        <p>
          Se você acredita que o tratamento dos seus dados viola o GDPR, pode apresentar uma
          reclamação à autoridade de proteção de dados do seu país. Para residentes na Itália,
          a autoridade competente é o Garante per la Protezione dei Dati Personali:{" "}
          <a className="text-brand-aqua hover:text-brand-blue underline underline-offset-4" href="https://www.garanteprivacy.it/" target="_blank" rel="noopener">
            garanteprivacy.it
          </a>
          . Se você residir em outro Estado-Membro da UE, pode recorrer à sua autoridade
          nacional competente.
        </p>
      </Section>

      <Section title="15. Contato">
        <div className="rounded-[14px] border border-divider bg-bg-card/60 p-6">
          <ul className="space-y-1.5 text-sm">
            <li><span className="text-text-muted">Privacidade:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:privacy@fitmesh.fit">privacy@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Suporte:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:support@fitmesh.fit">support@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Geral:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:hello@fitmesh.fit">hello@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Site:</span> <a className="text-brand-aqua hover:text-brand-blue" href="https://www.fitmesh.fit">www.fitmesh.fit</a></li>
          </ul>
        </div>
      </Section>
    </>
  );
}

function PrivacyFR() {
  return (
    <>
      <Section title="1. Responsable du traitement">
        <div className="rounded-[14px] border border-divider bg-bg-card/60 p-6">
          <TraderIdentity locale="fr" showContact={false} className="text-sm" />
          <ul className="mt-4 space-y-1.5 text-sm">
            <li><span className="text-text-muted">Contact vie privée:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:privacy@fitmesh.fit">privacy@fitmesh.fit</a></li>
            <li><span className="text-text-muted">DPO (Délégué à la Protection des Données):</span> non désigné. Le traitement ne relève pas des cas de désignation obligatoire prévus à l'art. 37 du RGPD (autorité publique, surveillance systématique à grande échelle, catégories particulières à grande échelle). Pour toute demande relative à la vie privée, contactez l'adresse e-mail ci-dessus.</li>
          </ul>
        </div>
      </Section>

      <Section title="2. Introduction">
        <p>
          FitMesh Sync ("nous", "notre", "l'application") respecte votre vie privée et s'engage à
          protéger vos données personnelles. Cette Politique de confidentialité explique comment nous
          collectons, utilisons et protégeons les informations de santé lorsque vous utilisez notre
          application mobile FitMesh Sync (<em>com.fitmeshsync.app</em> sur Google Play).
        </p>
        <p>
          Base légale du traitement: art. 6(1)(b) du RGPD (exécution du service demandé par
          l'utilisateur) et art. 9(2)(a) du RGPD (consentement explicite au traitement de données
          relatives à la santé, accordé via les autorisations Health Connect/Samsung Health dans
          l'application).
        </p>
      </Section>

      <Section title="3. Données collectées">
        <p>
          FitMesh Sync lit les données de santé suivantes depuis votre appareil Android via des
          services autorisés (Health Connect, Samsung Health Data SDK):
        </p>
        <List items={[
          ["Activité physique", "pas, distance parcourue, calories brûlées (actives et totales), étages montés"],
          ["Fréquence cardiaque", "moyenne, plage min/max, fréquence cardiaque au repos, HRV"],
          ["Sommeil", "durée totale, phases (profond, REM, léger, éveillé), heures de début et de fin"],
          ["Composition corporelle", "poids, taille, IMC (si renseignés par l'utilisateur)"],
          ["Autres paramètres", "saturation en oxygène (SpO₂), VO₂ max, température cutanée, dénivelé"],
          ["Séances d'entraînement", "type d'activité, durée, distance, calories"],
          ["Compte", "adresse e-mail (pour l'authentification via Supabase Auth) et identifiant de l'appareil"],
        ]} />
        <Callout>
          Important: ces données sont lues uniquement depuis les services de santé déjà présents
          sur votre appareil et seulement après que vous avez accordé explicitement les
          autorisations nécessaires.
        </Callout>
      </Section>

      <Section title="4. Utilisation des données">
        <p>Les données collectées sont utilisées exclusivement pour:</p>
        <List items={[
          ["Synchronisation", "recevoir et stocker vos métriques de santé sur notre backend cloud"],
          ["Visualisation", "afficher les données sur le tableau de bord de l'application"],
          ["Support", "diagnostiquer les problèmes techniques lorsque vous nous les signalez par e-mail"],
          ["Notifications", "envoyer des rappels configurables (par exemple, rappels de synchronisation) via Firebase Cloud Messaging"],
        ]} />
        <p className="text-text-primary font-medium">
          Nous ne vendons, ne partageons ni n'utilisons vos données à des fins publicitaires ou marketing.
          Aucun profilage automatisé produisant des effets juridiques sur l'utilisateur n'est effectué.
        </p>
      </Section>

      <Section title="5. Stockage des données">
        <p>
          Les données synchronisées sont envoyées au backend FitMesh Sync hébergé sur:
        </p>
        <List items={[
          ["Vercel Inc.", "hébergement de l'API serverless de fitmesh.fit (région préférée: Europe fra1; certaines fonctions edge s'exécutent dans la région la plus proche de l'utilisateur)"],
          ["Supabase Inc.", "base de données PostgreSQL gérée + authentification + stockage (projet en région UE, eu-central-1 Francfort)"],
        ]} />
        <p>
          Les données restent sur votre appareil Android dans un cache local jusqu'au moment de
          la synchronisation. Après confirmation de réception, le cache local est vidé.
        </p>
      </Section>

      <Section title="6. Transferts internationaux de données (hors UE)">
        <p>
          La base de données principale (Supabase Postgres) est hébergée dans l'Union européenne
          (Francfort, Allemagne). Toutefois, certains services auxiliaires impliquent un transfert
          vers des pays tiers, notamment les États-Unis:
        </p>
        <List items={[
          ["Vercel (États-Unis)", "edge runtime et journalisation des requêtes. Transfert encadré par les Clauses Contractuelles Types (CCT) approuvées par la Commission européenne (Décision 2021/914) et par l'Avenant sur le traitement des données signé avec Vercel"],
          ["Resend (États-Unis)", "envoi d'e-mails transactionnels (confirmation d'inscription bêta, communications de support). Transfert encadré par CCT + DPA"],
          ["Firebase Cloud Messaging (Google LLC, États-Unis)", "transport des notifications push. Google adhère aux CCT et au Cadre de protection des données UE-États-Unis"],
          ["Google Sign-In (Google LLC, États-Unis)", "authentification optionnelle via compte Google. Transfert encadré par CCT + DPF"],
        ]} />
        <p>
          Avant de transférer des données vers les États-Unis, nous avons réalisé une Évaluation
          d'Impact du Transfert: les données transférées sont limitées et n'incluent pas
          d'identifiants biométriques bruts; les CCT comprennent des clauses de suspension en cas
          de demandes d'autorités gouvernementales; les fournisseurs retenus adhèrent au Cadre de
          protection des données UE-États-Unis lorsqu'il est disponible.
        </p>
      </Section>

      <Section title="7. Conservation des données">
        <List items={[
          ["Métriques de santé", "conservées tant que le compte utilisateur est actif. La suppression du compte est exécutée automatiquement dans les 24 heures suivant la demande (processus planifié actif), supprimant définitivement les données de santé associées"],
          ["Journaux applicatifs et de synchronisation", "conservés 90 jours à des fins de diagnostic, puis supprimés automatiquement"],
          ["E-mails de contact (confidentialité/support)", "conservés 24 mois pour assurer la continuité du support, puis supprimés"],
          ["Sauvegardes de la base de données", "rotation sur 7 jours via la récupération point-in-time de Supabase"],
          ["Données d'inscription bêta", "conservées jusqu'au lancement public, puis anonymisées ou supprimées"],
        ]} />
      </Section>

      <Section title="8. Autorisations requises">
        <p>FitMesh Sync requiert les autorisations suivantes:</p>
        <List items={[
          ["Health Connect", "pour lire les données de santé depuis le système d'exploitation Android"],
          ["Samsung Health (optionnel)", "si vous possédez une Galaxy Watch, pour des données supplémentaires non exposées par Health Connect"],
          ["Accès à Internet", "pour synchroniser les données avec le backend FitMesh Sync"],
          ["Synchronisation en arrière-plan", "pour envoyer des données périodiquement même lorsque l'application est fermée"],
          ["Notifications", "pour recevoir des rappels de synchronisation et des avis système"],
          ["Exemption d'optimisation de la batterie", "pour garantir une synchronisation régulière (requis sous Android 14+)"],
        ]} />
        <p>
          Toutes les autorisations sont demandées explicitement et vous pouvez les révoquer à
          tout moment depuis les paramètres de l'appareil ou de l'application.
        </p>
      </Section>

      <Section title="9. Sécurité des données">
        <List items={[
          ["Transport", "toutes les données transitent via HTTPS/TLS 1.2+ vers fitmesh.fit"],
          ["Persistance locale", "le cache local est vidé après livraison confirmée par le serveur"],
          ["Jetons d'authentification", "JWT Supabase stockés dans l'Android Keystore (flutter_secure_storage)"],
          ["Sécurité au niveau des lignes (RLS)", "chaque utilisateur ne peut lire et écrire que ses propres enregistrements (politiques RLS de Supabase sur toutes les tables exposées)"],
          ["Aucun traceur tiers dans l'application", "aucun SDK d'analyse, de publicité ou de profilage n'est intégré dans l'application"],
        ]} />
      </Section>

      <Section title="10. Vos droits">
        <p>Conformément au RGPD, vous disposez du droit de:</p>
        <List items={[
          ["Accès", "demander une copie de vos données stockées dans nos systèmes"],
          ["Rectification", "corriger des données inexactes ou incomplètes"],
          ["Effacement", "demander la suppression complète de votre compte et des données associées. La demande est exécutée automatiquement dans les 24 heures"],
          ["Limitation", "demander la limitation du traitement dans des cas spécifiques"],
          ["Portabilité", "exporter toutes vos données vous-même, au format JSON structuré, depuis la page d'export disponible dans l'espace utilisateur (/app/export)"],
          ["Opposition", "vous opposer au traitement pour des raisons légitimes"],
          ["Retrait du consentement", "désactiver les autorisations d'accès aux données de santé à tout moment (le retrait ne remet pas en cause la licéité du traitement effectué avant celui-ci)"],
        ]} />
        <p>
          Vous pouvez exercer vous-même les droits à la portabilité (export des données) et à
          l'effacement directement depuis l'espace utilisateur. Pour les autres droits, ou si vous
          le préférez, écrivez-nous à{" "}
          <a className="text-brand-aqua hover:text-brand-blue underline underline-offset-4" href="mailto:privacy@fitmesh.fit">
            privacy@fitmesh.fit
          </a>
          . Nous répondons dans un délai de 30 jours conformément à l'art. 12 du RGPD.
        </p>
      </Section>

      <Section title="11. Sous-traitants tiers">
        <p>FitMesh Sync fait appel aux sous-traitants suivants:</p>
        <List items={[
          ["Health Connect (Google LLC)", "source de données de santé Android, lues localement, non communiquées par nous à Google"],
          ["Samsung Health Data SDK (Samsung Electronics)", "source de données Galaxy Watch, lues localement"],
          ["Supabase Inc.", "PostgreSQL géré + Auth (Francfort, DE), DPA signé"],
          ["Vercel Inc.", "hébergement API serverless (États-Unis, edge global), DPA signé + CCT"],
          ["Resend, Inc.", "envoi d'e-mails transactionnels (États-Unis), DPA + CCT"],
          ["Google LLC (Firebase Cloud Messaging)", "transport des notifications push (États-Unis), DPA + CCT + DPF"],
          ["Google LLC (Google Sign-In, optionnel)", "authentification OAuth (États-Unis), DPA + CCT + DPF"],
          ["Google LLC (Google Play Billing)", "gestion des achats intégrés, soumis aux Conditions d'utilisation de Google Play"],
          ["Google Analytics 4 (site web uniquement, opt-in)", "analyse anonyme activée uniquement après consentement explicite via la bannière de cookies"],
        ]} />
        <p>
          Plus de détails sur les cookies du site web dans notre{" "}
          <a href="/fr/cookies" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">Politique de cookies</a>.
        </p>
      </Section>

      <Section title="12. Modifications">
        <p>
          Nous pouvons mettre à jour cette Politique de confidentialité de temps à autre. Pour les
          modifications importantes, nous vous en informerons par e-mail ou via un avis dans
          l'application avant la prochaine synchronisation. La date de dernière mise à jour est
          indiquée en haut de cette page.
        </p>
      </Section>

      <Section title="13. Mineurs">
        <p>
          FitMesh Sync n'est pas destiné aux utilisateurs de moins de 16 ans (seuil prévu à
          l'art. 8 du RGPD pour le consentement numérique en Italie). Nous ne collectons pas
          sciemment de données personnelles de mineurs de moins de 16 ans sans le consentement
          du titulaire de l'autorité parentale.
        </p>
      </Section>

      <Section title="14. Réclamations auprès de l'autorité de contrôle">
        <p>
          Si vous estimez que le traitement de vos données enfreint le RGPD, vous pouvez
          introduire une réclamation auprès de l'autorité nationale de protection des données
          compétente. Pour les résidents en Italie, il s'agit du Garante per la Protezione dei
          Dati Personali:{" "}
          <a className="text-brand-aqua hover:text-brand-blue underline underline-offset-4" href="https://www.garanteprivacy.it/" target="_blank" rel="noopener">
            garanteprivacy.it
          </a>
          . Si vous résidez dans un autre État membre de l'UE, vous pouvez vous adresser à votre
          autorité nationale compétente.
        </p>
      </Section>

      <Section title="15. Contact">
        <div className="rounded-[14px] border border-divider bg-bg-card/60 p-6">
          <ul className="space-y-1.5 text-sm">
            <li><span className="text-text-muted">Confidentialité:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:privacy@fitmesh.fit">privacy@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Support:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:support@fitmesh.fit">support@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Général:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:hello@fitmesh.fit">hello@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Site web:</span> <a className="text-brand-aqua hover:text-brand-blue" href="https://www.fitmesh.fit">www.fitmesh.fit</a></li>
          </ul>
        </div>
      </Section>
    </>
  );
}
