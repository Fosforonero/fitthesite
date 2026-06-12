import type { Metadata } from "next";
import { locales, type Locale, getDictionary } from "@/lib/i18n";
import { LegalPage, Section, Callout } from "@/components/legal/LegalLayout";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

const SITE_URL = "https://www.fitmesh.fit";
const LAST_UPDATED_IT = "12 maggio 2026";
const LAST_UPDATED_EN = "May 12, 2026";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<Locale, string> = {
    it: "Termini di Servizio",
    en: "Terms of Service",
  };
  const desc: Record<Locale, string> = {
    it: "Termini e condizioni d'uso di FitMesh Sync: licenza, acquisti, disclaimer salute, recesso UE, limitazione di responsabilità.",
    en: "FitMesh Sync terms and conditions: license, purchases, health disclaimer, EU right of withdrawal, liability cap.",
  };
  const lc = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  return {
    title: titles[lc],
    description: desc[lc],
    alternates: {
      canonical: `${SITE_URL}/${lc}/terms`,
      languages: {
        it: `${SITE_URL}/it/terms`,
        en: `${SITE_URL}/en/terms`,
        "x-default": `${SITE_URL}/it/terms`,
      },
    },
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const lc: Locale = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  const t = await getDictionary(lc);
  const lastUpdated = `${t.legal.last_updated}: ${lc === "it" ? LAST_UPDATED_IT : LAST_UPDATED_EN}`;

  const crumbName = lc === "it" ? "Termini di Servizio" : "Terms of Service";
  return (
    <>
      <Breadcrumbs items={[{ name: crumbName, path: `/${lc}/terms` }]} locale={lc} />
      <LegalPage kicker={t.legal.section} title={t.legal.terms_title} lastUpdated={lastUpdated}>
        {lc === "it" ? <TermsIT /> : <TermsEN />}
      </LegalPage>
    </>
  );
}

function Forbidden({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 mt-3">
      {items.map((rule) => (
        <li key={rule} className="flex gap-2">
          <span className="text-error mt-0.5">✗</span>
          <span>{rule}</span>
        </li>
      ))}
    </ul>
  );
}

function TermsIT() {
  return (
    <>
      <Section title="1. Accettazione dei termini">
        <p>
          I presenti Termini di Servizio ("Termini") regolano l'uso dell'app FitMesh Sync
          (<em>com.fitmeshsync.app</em>), del sito{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">fitmesh.fit</code>{" "}
          e dei servizi correlati (collettivamente, il "Servizio"), forniti da Matteo Pizzi.
        </p>
        <p>Utilizzando il Servizio, accetti integralmente questi Termini.</p>
      </Section>

      <Section title="2. Cos'è FitMesh Sync">
        <p>
          FitMesh Sync è un'applicazione che legge dati di salute dal tuo dispositivo Android
          (tramite Health Connect, Samsung Health Data SDK) e li sincronizza su un server di tua
          scelta, permettendoti di visualizzarli in una dashboard web personale.
        </p>
      </Section>

      <Section title="3. Disclaimer salute — IMPORTANTE">
        <Callout variant="warning">
          <p>
            <strong className="text-text-primary">FitMesh Sync NON è un dispositivo medico.</strong>{" "}
            Non fornisce diagnosi, terapie, raccomandazioni mediche o sostituisce in alcun modo il
            parere di un medico qualificato.
          </p>
          <p className="mt-3">
            I dati visualizzati sono valori grezzi forniti dal tuo smartwatch e da Health Connect:
            possono contenere errori, ritardi, valori mancanti o anomali. <strong className="text-text-primary">
            Non utilizzare FitMesh Sync per decisioni sanitarie critiche.</strong>
          </p>
          <p className="mt-3">
            Per problemi di salute consulta sempre un medico. In caso di emergenza chiama il 112
            (Italia) o il numero di emergenza locale.
          </p>
        </Callout>
      </Section>

      <Section title="4. Licenza d'uso">
        <p>
          Ti concediamo una licenza personale, non esclusiva, non trasferibile e revocabile per
          installare e utilizzare l'app sui dispositivi Android di tua proprietà o sotto il tuo
          controllo, esclusivamente per uso personale.
        </p>
        <p>Non puoi:</p>
        <Forbidden items={[
          "Decompilare, disassemblare o fare reverse engineering dell'app, salvo nei limiti consentiti dalla legge",
          "Rivendere, sublicenziare o redistribuire l'app",
          "Utilizzare il Servizio per attività illegali o per violare diritti di terzi",
          "Tentare di accedere a dati di altri utenti sul nostro server pubblico",
          "Sovraccaricare deliberatamente i nostri server con richieste eccessive",
        ]} />
      </Section>

      <Section title="5. Account e dati">
        <p>
          FitMesh Sync non richiede registrazione di un account tradizionale. Ogni installazione
          genera un identificativo univoco del dispositivo (UUID o Android ID) usato per associare
          i dati al tuo dispositivo sul server scelto.
        </p>
        <p>
          <strong className="text-text-primary">Sei tu il responsabile dei tuoi dati.</strong>{" "}
          Conserva il tuo Device ID se intendi spostare l'app su un nuovo telefono. Il nostro server
          pubblico è fornito come servizio gratuito ma <em>best-effort</em>: non garantiamo backup,
          non garantiamo retention permanente, e potremmo cancellare dati inattivi da oltre 12 mesi
          previa notifica.
        </p>
      </Section>

      <Section title="6. Acquisti in-app">
        <p>FitMesh Sync offre funzionalità avanzate ("Pro") tramite acquisto in-app gestito da Google Play Billing:</p>
        <ul className="space-y-2 mt-3">
          <li className="flex gap-2"><span className="text-brand-aqua mt-0.5">•</span>
            <span><strong className="text-text-primary">Acquisto unico — €3,99 su Android (€4,99 su iPhone):</strong> sblocca permanentemente tutte le funzionalità Pro sull'account associato. Nessun abbonamento, nessun rinnovo automatico.</span>
          </li>
        </ul>
        <p>
          Tutti i pagamenti sono gestiti da Google e soggetti ai{" "}
          <a href="https://play.google.com/intl/it/about/play-terms/" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
            Termini Google Play
          </a>
          . Non vediamo i tuoi dati di pagamento.
        </p>
      </Section>

      <Section title="7. Diritto di recesso (UE)">
        <p>
          Se sei un consumatore residente nell'Unione Europea, hai diritto di recedere dall'acquisto
          entro <strong className="text-text-primary">14 giorni</strong> senza fornire motivazione
          (Direttiva 2011/83/UE).
        </p>
        <p>
          Per esercitare il recesso sui pagamenti Google Play utilizza la procedura ufficiale di
          rimborso:{" "}
          <a href="https://support.google.com/googleplay/answer/2479637" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
            support.google.com/googleplay/answer/2479637
          </a>
          .
        </p>
        <p>
          <strong className="text-text-primary">Nota:</strong> il diritto di recesso si perde se hai
          iniziato a utilizzare le funzionalità Pro durante i 14 giorni e ne hai accettato
          espressamente l'esecuzione immediata (clausola standard Google Play).
        </p>
      </Section>

      <Section title="8. Disponibilità del Servizio">
        <p>
          Facciamo del nostro meglio per garantire il Servizio 24/7 ma non ne possiamo garantire il
          funzionamento ininterrotto. Manutenzioni, guasti hardware, blackout dei provider possono
          causare interruzioni temporanee.
        </p>
        <p>
          Non siamo responsabili per perdite causate da interruzioni. Consigliamo di non utilizzare
          FitMesh Sync come unico backup dei tuoi dati di salute.
        </p>
      </Section>

      <Section title="9. Modifiche al Servizio">
        <p>
          Potremmo modificare, sospendere o interrompere parti del Servizio. Per modifiche
          significative che impattano funzionalità acquistate, ti avviseremo con almeno 30 giorni di
          preavviso.
        </p>
        <p>
          In caso di interruzione completa del Servizio, daremo almeno 60 giorni per esportare i
          dati e rimborseremo eventuali abbonamenti attivi su base pro-rata.
        </p>
      </Section>

      <Section title="10. Limitazione di responsabilità">
        <p>
          Nei limiti consentiti dalla legge applicabile, FitMesh Sync è fornita "così com'è" senza
          garanzie esplicite o implicite. In nessun caso saremo responsabili per danni indiretti,
          incidentali, speciali o consequenziali. La nostra responsabilità totale verso di te non
          potrà eccedere l'importo pagato negli ultimi 12 mesi.
        </p>
        <p>
          Queste limitazioni non si applicano a danni causati da nostra negligenza grave, dolo o nei
          casi in cui la legge applicabile non lo consenta.
        </p>
      </Section>

      <Section title="11. Proprietà intellettuale">
        <p>
          Il marchio "FitMesh Sync", il logo, il design dell'app e del sito sono di nostra
          proprietà. I dati di salute che sincronizzi rimangono di tua proprietà.
        </p>
      </Section>

      <Section title="12. Risoluzione delle controversie">
        <p>
          Cerchiamo sempre di risolvere informalmente. Contattaci a{" "}
          <a href="mailto:hello@fitmesh.fit" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">hello@fitmesh.fit</a>
          {" "}— rispondiamo entro 30 giorni.
        </p>
        <p>
          Per i consumatori UE è disponibile la piattaforma ODR:{" "}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
            ec.europa.eu/consumers/odr
          </a>
          .
        </p>
      </Section>

      <Section title="13. Legge applicabile e foro competente">
        <p>
          I presenti Termini sono regolati dalla legge italiana. Per i consumatori UE restano
          applicabili le tutele inderogabili previste dalla legge del paese di residenza.
          Foro competente: foro del consumatore (per i consumatori UE) o Milano.
        </p>
      </Section>

      <Section title="14. Contatti">
        <div className="rounded-[14px] border border-divider bg-bg-card/60 p-6">
          <p><strong className="text-text-primary">Titolare:</strong> Matteo Pizzi</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li><span className="text-text-muted">Email:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:hello@fitmesh.fit">hello@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Supporto:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:support@fitmesh.fit">support@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Privacy/Legale:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:privacy@fitmesh.fit">privacy@fitmesh.fit</a></li>
          </ul>
        </div>
      </Section>
    </>
  );
}

function TermsEN() {
  return (
    <>
      <Section title="1. Acceptance of Terms">
        <p>
          These Terms of Service ("Terms") govern your use of the FitMesh Sync app
          (<em>com.fitmeshsync.app</em>), the{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">fitmesh.fit</code>{" "}
          website and related services (together, the "Service"), provided by Matteo Pizzi.
        </p>
        <p>By using the Service, you accept these Terms in full.</p>
      </Section>

      <Section title="2. What FitMesh Sync is">
        <p>
          FitMesh Sync is an application that reads health data from your Android device (via
          Health Connect, Samsung Health Data SDK) and syncs it to a server of your choice,
          allowing you to view it on a personal web dashboard.
        </p>
      </Section>

      <Section title="3. Health disclaimer — IMPORTANT">
        <Callout variant="warning">
          <p>
            <strong className="text-text-primary">FitMesh Sync is NOT a medical device.</strong>{" "}
            It does not provide diagnoses, therapies, medical recommendations or any substitute
            for advice from a qualified medical professional.
          </p>
          <p className="mt-3">
            The data shown is raw values from your smartwatch and Health Connect: it may contain
            errors, delays, missing or anomalous values. <strong className="text-text-primary">
            Do not use FitMesh Sync for critical health decisions.</strong>
          </p>
          <p className="mt-3">
            For health concerns, always consult a doctor. In an emergency call 112 (EU) or your
            local emergency number.
          </p>
        </Callout>
      </Section>

      <Section title="4. License">
        <p>
          We grant you a personal, non-exclusive, non-transferable, revocable license to install
          and use the app on Android devices you own or control, for personal use only.
        </p>
        <p>You may NOT:</p>
        <Forbidden items={[
          "Decompile, disassemble or reverse-engineer the app, except as allowed by law",
          "Resell, sublicense or redistribute the app",
          "Use the Service for illegal activities or to infringe third-party rights",
          "Attempt to access other users' data on our public server",
          "Deliberately overload our servers with excessive requests",
        ]} />
      </Section>

      <Section title="5. Account and data">
        <p>
          FitMesh Sync does not require a traditional account. Each install generates a unique
          device identifier (UUID or Android ID) used to associate data with your device on the
          chosen server.
        </p>
        <p>
          <strong className="text-text-primary">You are responsible for your data.</strong> Keep
          your Device ID if you plan to move the app to a new phone. Our public server is offered
          as a free best-effort service: we do not guarantee backups, do not guarantee permanent
          retention, and may delete data inactive for over 12 months with prior notice.
        </p>
      </Section>

      <Section title="6. In-app purchases">
        <p>FitMesh Sync offers advanced ("Pro") features via in-app purchase managed by Google Play Billing:</p>
        <ul className="space-y-2 mt-3">
          <li className="flex gap-2"><span className="text-brand-aqua mt-0.5">•</span>
            <span><strong className="text-text-primary">One-time purchase — €3.99 on Android (€4.99 on iPhone):</strong> unlocks Pro features permanently on the associated account. No subscription, no auto-renewal.</span>
          </li>
        </ul>
        <p>
          All payments are handled by Google and subject to the{" "}
          <a href="https://play.google.com/intl/en/about/play-terms/" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
            Google Play Terms
          </a>
          . We do not see your payment data.
        </p>
      </Section>

      <Section title="7. Right of withdrawal (EU)">
        <p>
          If you are a consumer residing in the European Union, you have the right to withdraw
          from the purchase within <strong className="text-text-primary">14 days</strong> without
          giving a reason (EU Directive 2011/83).
        </p>
        <p>
          To exercise withdrawal on Google Play purchases, use the official refund procedure:{" "}
          <a href="https://support.google.com/googleplay/answer/2479637" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
            support.google.com/googleplay/answer/2479637
          </a>
          .
        </p>
        <p>
          <strong className="text-text-primary">Note:</strong> the right of withdrawal is lost if
          you have started actively using Pro features during the 14 days and explicitly accepted
          immediate execution at purchase time (standard Google Play clause).
        </p>
      </Section>

      <Section title="8. Service availability">
        <p>
          We strive to keep the Service available 24/7 but we cannot guarantee uninterrupted
          operation. Maintenance, hardware failures, provider outages may cause temporary
          interruptions.
        </p>
        <p>
          We are not liable for losses caused by interruptions. Do not rely on FitMesh Sync as
          your only health data backup.
        </p>
      </Section>

      <Section title="9. Service changes">
        <p>
          We may modify, suspend or discontinue parts of the Service. For material changes
          affecting paid features, we will notify you with at least 30 days' notice.
        </p>
        <p>
          If we discontinue the Service entirely, we will provide at least 60 days for you to
          export your data and refund active subscriptions on a pro-rata basis.
        </p>
      </Section>

      <Section title="10. Limitation of liability">
        <p>
          To the maximum extent permitted by law, FitMesh Sync is provided "as-is" with no
          warranties express or implied. We will not be liable for indirect, incidental, special
          or consequential damages. Our total liability to you cannot exceed the amount you paid
          in the last 12 months.
        </p>
        <p>
          These limitations do not apply to damages caused by gross negligence, willful misconduct,
          or where applicable law prohibits them.
        </p>
      </Section>

      <Section title="11. Intellectual property">
        <p>
          The "FitMesh Sync" trademark, logo, design of the app and website are our property. The
          health data you sync remains yours.
        </p>
      </Section>

      <Section title="12. Dispute resolution">
        <p>
          We try to resolve disputes informally. Contact us at{" "}
          <a href="mailto:hello@fitmesh.fit" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">hello@fitmesh.fit</a>
          {" "}— we respond within 30 days.
        </p>
        <p>
          EU consumers may also use the ODR platform:{" "}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
            ec.europa.eu/consumers/odr
          </a>
          .
        </p>
      </Section>

      <Section title="13. Governing law and jurisdiction">
        <p>
          These Terms are governed by Italian law. For EU consumers, the mandatory protections of
          their country of residence apply. Jurisdiction: consumer's forum (EU consumers) or
          Milan, Italy.
        </p>
      </Section>

      <Section title="14. Contact">
        <div className="rounded-[14px] border border-divider bg-bg-card/60 p-6">
          <p><strong className="text-text-primary">Service operator:</strong> Matteo Pizzi</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li><span className="text-text-muted">Email:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:hello@fitmesh.fit">hello@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Support:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:support@fitmesh.fit">support@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Privacy/Legal:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:privacy@fitmesh.fit">privacy@fitmesh.fit</a></li>
          </ul>
        </div>
      </Section>
    </>
  );
}
