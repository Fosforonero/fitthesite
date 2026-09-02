import type { Metadata } from "next";
import { locales, type Locale, getDictionary, localeAlternates } from "@/lib/i18n";
import { LegalPage, Section, Callout } from "@/components/legal/LegalLayout";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { LegalJsonLd } from "@/components/seo/LegalJsonLd";
import { TraderIdentity } from "@/components/legal/TraderIdentity";

const SITE_URL = "https://www.fitmesh.fit";
const LAST_UPDATED_IT = "4 agosto 2026";
const LAST_UPDATED_EN = "August 4, 2026";
const LAST_UPDATED_ES = "4 de agosto de 2026";
const LAST_UPDATED_DE = "4. August 2026";
const LAST_UPDATED_PT = "4 de agosto de 2026";
const LAST_UPDATED_FR = "4 août 2026";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<Locale, string> = {
    it: "Termini di Servizio",
    en: "Terms of Service",
    es: "Términos del Servicio",
    de: "Nutzungsbedingungen",
    pt: "Termos de Serviço",
    fr: "Conditions d'utilisation",
    pl: "Warunki korzystania z uslug",
    tr: "Hizmet Sartlari",
    nl: "Gebruiksvoorwaarden",
    ja: "利用規約",
    ko: "이용약관",
    sv: "Användarvillkor",
    da: "Servicevilkår",
    no: "Vilkår for bruk",
    fi: "Käyttöehdot",
  };
  const desc: Record<Locale, string> = {
    it: "Termini e condizioni d'uso di FitMesh Sync: licenza, acquisti, disclaimer salute, recesso UE, limitazione di responsabilità.",
    en: "FitMesh Sync terms and conditions: license, purchases, health disclaimer, EU right of withdrawal, liability cap.",
    es: "Términos y condiciones de uso de FitMesh Sync: licencia, compras, aviso de salud, desistimiento UE y limitación de responsabilidad.",
    de: "Nutzungsbedingungen von FitMesh Sync: Lizenz, Käufe, Gesundheitshinweis, EU-Widerrufsrecht und Haftungsbeschränkung.",
    pt: "Termos e condições de uso do FitMesh Sync: licença, compras, aviso de saúde, direito de arrependimento UE e limitação de responsabilidade.",
    fr: "Conditions d'utilisation de FitMesh Sync : licence, achats, avertissement santé, droit de rétractation UE et limitation de responsabilité.",
    pl: "Warunki korzystania z FitMesh Sync: licencja, zakupy, zastrzezenie zdrowotne, prawo odstapienia UE i ograniczenie odpowiedzialnosci.",
    tr: "FitMesh Sync kullanim sartlari ve kosullari: lisans, satin almalar, saglik sorumluluk reddi, AB cayma hakki ve sorumluluk siniri.",
    nl: "Gebruiksvoorwaarden van FitMesh Sync: licentie, aankopen, gezondheidsdisclaimer, EU-herroepingsrecht en aansprakelijkheidsbeperking.",
    ja: "FitMesh Sync利用規約: ライセンス、購入、健康免責事項、EU撤回権、責任制限。",
    ko: "FitMesh Sync 이용약관: 라이선스, 구매, 건강 고지, EU 철회권, 책임 제한.",
    sv: "FitMesh Syncs villkor: licens, köp, hälsoförbehåll, EU-ångerrätt och ansvarsbegränsning.",
    da: "FitMesh Syncs vilkår: licens, køb, sundhedsforbehold, EU-fortrydelsesret og ansvarsbegrænsning.",
    no: "FitMesh Syncs vilkår: lisens, kjøp, helseforbehold, EU-angrerett og ansvarsbegrensning.",
    fi: "FitMesh Syncin ehdot: lisenssi, ostokset, terveysvastuuvapauslauseke, EU-peruuttamisoikeus ja vastuunrajoitus.",
  };
  const lc = (locales as readonly string[]).includes(locale) ? (locale as Locale) : "it";
  return {
    // P0.17: stesso suffisso " · FitMesh" del blog, solo sul <title>
    // metadata — l'H1 (t.legal.terms_title, sotto) e' una fonte diversa.
    title: `${titles[lc]} · FitMesh`,
    description: desc[lc],
    alternates: {
      canonical: `${SITE_URL}/${lc}/terms`,
      languages: localeAlternates((l) => `${SITE_URL}/${l}/terms`),
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
  const lastUpdatedDate =
    lc === "it" ? LAST_UPDATED_IT :
    lc === "es" ? LAST_UPDATED_ES :
    lc === "de" ? LAST_UPDATED_DE :
    lc === "pt" ? LAST_UPDATED_PT :
    lc === "fr" ? LAST_UPDATED_FR :
    LAST_UPDATED_EN;
  const lastUpdated = `${t.legal.last_updated}: ${lastUpdatedDate}`;

  const crumbName =
    lc === "it" ? "Termini di Servizio" :
    lc === "es" ? "Términos del Servicio" :
    lc === "de" ? "Nutzungsbedingungen" :
    lc === "pt" ? "Termos de Serviço" :
    lc === "fr" ? "Conditions d'utilisation" :
    "Terms of Service";
  return (
    <>
      <Breadcrumbs items={[{ name: crumbName, path: `/${lc}/terms` }]} locale={lc} />
      <LegalJsonLd locale={lc} path="/terms" name={t.legal.terms_title} dateModified="2026-08-04" />
      <LegalPage kicker={t.legal.section} title={t.legal.terms_title} lastUpdated={lastUpdated}>
        {lc === "it" ? <TermsIT /> :
         lc === "es" ? <TermsES /> :
         lc === "de" ? <TermsDE /> :
         lc === "pt" ? <TermsPT /> :
         lc === "fr" ? <TermsFR /> :
         <TermsEN />}
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
          (tramite Health Connect, Samsung Health Data SDK) e li sincronizza sul backend cloud
          gestito da FitMesh (Supabase, infrastruttura UE), permettendoti di visualizzarli in una
          dashboard web personale.
        </p>
      </Section>

      <Section title="3. Disclaimer salute (IMPORTANTE)">
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
          Per usare la dashboard e sincronizzare i tuoi dati serve un account: accedi con un link via
          email o con Google (autenticazione gestita da Supabase Auth). L'app sul telefono si collega
          al tuo account tramite un codice di pairing; a ogni dispositivo è associato un identificativo
          univoco (Device ID) usato per distinguere le sorgenti dei dati.
        </p>
        <p>
          <strong className="text-text-primary">Sei tu il responsabile dei tuoi dati.</strong>{" "}
          I dati sono legati al tuo account, quindi puoi cambiare telefono ricollegandolo allo stesso
          account. Il nostro server è fornito come servizio ma <em>best-effort</em>: non garantiamo backup,
          non garantiamo retention permanente, e potremmo cancellare dati inattivi da oltre 12 mesi
          previa notifica.
        </p>
        <p>
          Puoi esportare tutti i tuoi dati in formato JSON e richiedere la cancellazione dell'account
          in autonomia dall'area utente. La cancellazione viene eseguita automaticamente entro 24 ore
          e rimuove definitivamente i dati associati. Maggiori dettagli nella{" "}
          <a href="/it/privacy" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">Privacy Policy</a>.
        </p>
      </Section>

      <Section title="6. Acquisti in-app">
        <p>FitMesh Sync è un servizio a pagamento. Ogni persona ha a disposizione una prova gratuita di 14 giorni con tutte le funzionalità Pro attive (inclusa la Mesh Famiglia fino a 8 membri); chi si unisce a una Mesh ha la propria prova di 14 giorni. Al termine dei 14 giorni l'accesso alle funzionalità richiede un acquisto: non esiste un piano gratuito permanente. Gli acquisti sono gestiti tramite gli store (Google Play Billing su Android, App Store su iPhone):</p>
        <ul className="space-y-2 mt-3">
          <li className="flex gap-2"><span className="text-brand-aqua mt-0.5">•</span>
            <span><strong className="text-text-primary">Abbonamento, €1,19 ogni 6 mesi:</strong> mantiene attive tutte le funzionalità Pro finché l'abbonamento è in corso. Si rinnova automaticamente ogni 6 mesi e puoi disdirlo in qualsiasi momento dalle impostazioni del tuo store.</span>
          </li>
          <li className="flex gap-2"><span className="text-brand-aqua mt-0.5">•</span>
            <span><strong className="text-text-primary">Sblocco a vita (acquisto unico), €3,99 su Android (€4,99 su iPhone):</strong> sblocca permanentemente tutte le funzionalità Pro sull'account associato, con un pagamento singolo. Nessun rinnovo.</span>
          </li>
          <li className="flex gap-2"><span className="text-brand-aqua mt-0.5">•</span>
            <span><strong className="text-text-primary">Founder Pro (primi 1.000 account, gratuito):</strong> gli account registrati entro il 31 luglio 2026, con una prima sincronizzazione reale verificata entro 14 giorni dalla registrazione, tra i primi 1.000 a soddisfare questi requisiti, ricevono l'accesso Pro a vita, senza alcun costo, nessuna scadenza e nessun acquisto richiesto. Il beneficio <strong className="text-text-primary">non è in alcun modo subordinato</strong> al rilascio di recensioni, valutazioni a stelle o altre azioni promozionali. Gli account creati dal 1° agosto 2026 non sono idonei al programma Founder.</span>
          </li>
        </ul>
        <p>I prezzi indicati sono prezzi di lancio e potranno aumentare in futuro per i nuovi acquisti; il prezzo applicato resta quello mostrato al momento dell'acquisto.</p>
        <p>
          Il beneficio Founder Pro rimane attivo per tutta la durata del Servizio. Non può essere revocato unilateralmente, salvo in caso di violazione dei presenti Termini che comporti la sospensione dell'account. In caso di interruzione completa del Servizio si applicano le condizioni della Sezione 9 (preavviso minimo di 60 giorni).
        </p>
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
          In caso di interruzione completa del Servizio, daremo almeno 60 giorni di preavviso per
          esportare i dati. Per gli abbonamenti attivi, in caso di cessazione del Servizio la
          quota già pagata viene rimborsata in misura proporzionale al periodo non utilizzato. Gli
          acquisti a vita sono già pienamente eseguiti al momento del pagamento e il Founder Pro è
          gratuito; pertanto, per questi, nessun rimborso è dovuto in caso di cessazione del Servizio.
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
          {": rispondiamo entro 30 giorni."}
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
          <TraderIdentity locale="it" showContact={false} className="text-sm" />
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
          Health Connect, Samsung Health Data SDK) and syncs it to FitMesh's managed cloud
          backend (Supabase, EU infrastructure), allowing you to view it on a personal web
          dashboard.
        </p>
      </Section>

      <Section title="3. Health disclaimer (IMPORTANT)">
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
          Using the dashboard and syncing your data requires an account: you sign in with an email
          link or with Google (authentication handled by Supabase Auth). The phone app connects to
          your account through a pairing code; each device gets a unique identifier (Device ID) used
          to tell data sources apart.
        </p>
        <p>
          <strong className="text-text-primary">You are responsible for your data.</strong> Your data
          is tied to your account, so you can switch phones by re-linking them to the same account. Our
          server is offered as a best-effort service: we do not guarantee backups, do not guarantee
          permanent retention, and may delete data inactive for over 12 months with prior notice.
        </p>
        <p>
          You can export all of your data in JSON format and request account deletion yourself from
          the user area. Deletion runs automatically within 24 hours and permanently removes the
          associated data. More details in our{" "}
          <a href="/en/privacy" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">Privacy Policy</a>.
        </p>
      </Section>

      <Section title="6. In-app purchases">
        <p>FitMesh Sync is a paid service. Every person gets a 14-day free trial with all Pro features active (including the Family Mesh of up to 8 members); anyone joining a Mesh gets their own 14-day trial. After the 14 days, access to the features requires a purchase: there is no permanent free plan. Purchases are handled through the stores (Google Play Billing on Android, App Store on iPhone):</p>
        <ul className="space-y-2 mt-3">
          <li className="flex gap-2"><span className="text-brand-aqua mt-0.5">•</span>
            <span><strong className="text-text-primary">Subscription, €1.19 every 6 months:</strong> keeps all Pro features active for as long as the subscription is running. It renews automatically every 6 months and you can cancel it at any time from your store settings.</span>
          </li>
          <li className="flex gap-2"><span className="text-brand-aqua mt-0.5">•</span>
            <span><strong className="text-text-primary">Lifetime unlock (one-time purchase), €3.99 on Android (€4.99 on iPhone):</strong> unlocks all Pro features permanently on the associated account with a single payment. No renewal.</span>
          </li>
          <li className="flex gap-2"><span className="text-brand-aqua mt-0.5">•</span>
            <span><strong className="text-text-primary">Founder Pro (first 1,000 accounts, free):</strong> accounts registered by 31 July 2026, with a first verified sync within 14 days of registration, among the first 1,000 to meet these requirements, receive lifetime Pro access at no cost, no expiry date and no purchase required. The benefit is <strong className="text-text-primary">in no way conditional</strong> on leaving reviews, star ratings or any other promotional action. Accounts created from 1 August 2026 are not eligible for the Founder program.</span>
          </li>
        </ul>
        <p>The prices shown are launch prices and may increase in the future for new purchases; the price that applies is the one shown to you at the time of purchase.</p>
        <p>
          The Founder Pro benefit remains active for the entire duration of the Service. It cannot be revoked unilaterally, except in cases of violation of these Terms resulting in account suspension. In the event of complete Service shutdown, the conditions of Section 9 apply (minimum 60 days notice).
        </p>
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
          If we discontinue the Service entirely, we will provide at least 60 days' notice for
          you to export your data. For active subscriptions, if the Service is shut down the fee
          already paid is refunded in proportion to the unused period. Lifetime purchases are fully
          executed at the time of payment, and Founder Pro is free; therefore, for these, no refund
          is due upon Service shutdown.
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
          {": we respond within 30 days."}
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
          <TraderIdentity locale="en" showContact={false} className="text-sm" />
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

function TermsES() {
  return (
    <>
      <Section title="1. Aceptación de los términos">
        <p>
          Estos Términos del Servicio ("Términos") rigen el uso de la app FitMesh Sync
          (<em>com.fitmeshsync.app</em>), del sitio{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">fitmesh.fit</code>{" "}
          y de los servicios relacionados (en conjunto, el "Servicio"), proporcionados por Matteo Pizzi.
        </p>
        <p>Al usar el Servicio, aceptas estos Términos en su totalidad.</p>
      </Section>

      <Section title="2. Qué es FitMesh Sync">
        <p>
          FitMesh Sync es una aplicación que lee datos de salud de tu dispositivo Android (a través
          de Health Connect y el Samsung Health Data SDK) y los sincroniza con el backend en la
          nube gestionado por FitMesh (Supabase, infraestructura en la UE), permitiéndote
          consultarlos en un panel web personal.
        </p>
      </Section>

      <Section title="3. Aviso sobre salud (IMPORTANTE)">
        <Callout variant="warning">
          <p>
            <strong className="text-text-primary">FitMesh Sync NO es un dispositivo médico.</strong>{" "}
            No ofrece diagnósticos, terapias, recomendaciones médicas ni sustituye en ningún caso
            la opinión de un profesional de la salud cualificado.
          </p>
          <p className="mt-3">
            Los datos que se muestran son valores en bruto proporcionados por tu smartwatch y
            Health Connect: pueden contener errores, retrasos, valores ausentes o anómalos.{" "}
            <strong className="text-text-primary">
              No uses FitMesh Sync para tomar decisiones críticas sobre tu salud.
            </strong>
          </p>
          <p className="mt-3">
            Ante cualquier problema de salud, consulta siempre a un médico. En caso de emergencia,
            llama al 112 (UE) o al número de emergencias local.
          </p>
        </Callout>
      </Section>

      <Section title="4. Licencia de uso">
        <p>
          Te concedemos una licencia personal, no exclusiva, intransferible y revocable para
          instalar y utilizar la app en los dispositivos Android de tu propiedad o bajo tu control,
          exclusivamente para uso personal.
        </p>
        <p>No puedes:</p>
        <Forbidden items={[
          "Descompilar, desensamblar o aplicar ingeniería inversa a la app, salvo en los casos permitidos por la ley",
          "Revender, sublicenciar o redistribuir la app",
          "Usar el Servicio para actividades ilegales o para vulnerar derechos de terceros",
          "Intentar acceder a los datos de otros usuarios en nuestro servidor público",
          "Sobrecargar deliberadamente nuestros servidores con solicitudes excesivas",
        ]} />
      </Section>

      <Section title="5. Cuenta y datos">
        <p>
          Para usar el panel y sincronizar tus datos necesitas una cuenta: inicias sesión con un
          enlace por email o con Google (autenticación gestionada por Supabase Auth). La app del
          teléfono se conecta a tu cuenta mediante un código de emparejamiento; cada dispositivo
          tiene un identificador único (Device ID) que sirve para distinguir las fuentes de datos.
        </p>
        <p>
          <strong className="text-text-primary">Eres responsable de tus datos.</strong>{" "}
          Tus datos están vinculados a tu cuenta, así que puedes cambiar de teléfono volviéndolo a
          vincular a la misma cuenta. Nuestro servidor se ofrece como servicio con disponibilidad
          razonable: no garantizamos copias de seguridad, no garantizamos retención permanente, y
          podríamos eliminar datos inactivos durante más de 12 meses previo aviso.
        </p>
        <p>
          Puedes exportar todos tus datos en formato JSON y solicitar la eliminación de la cuenta
          por ti mismo desde el área de usuario. La eliminación se ejecuta automáticamente en un
          plazo de 24 horas y borra de forma definitiva los datos asociados. Más detalles en nuestra{" "}
          <a href="/es/privacy" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">Política de privacidad</a>.
        </p>
      </Section>

      <Section title="6. Compras en la app">
        <p>FitMesh Sync es un servicio de pago. Cada persona dispone de una prueba gratuita de 14 días con todas las funciones Pro activas (incluida la Mesh Familia de hasta 8 miembros); quien se une a una Mesh tiene su propia prueba de 14 días. Transcurridos los 14 días, el acceso a las funciones requiere una compra: no existe un plan gratuito permanente. Las compras se gestionan a través de las tiendas (Google Play Billing en Android, App Store en iPhone):</p>
        <ul className="space-y-2 mt-3">
          <li className="flex gap-2"><span className="text-brand-aqua mt-0.5">•</span>
            <span><strong className="text-text-primary">Suscripción, 1,19 € cada 6 meses:</strong> mantiene activas todas las funciones Pro mientras la suscripción esté vigente. Se renueva automáticamente cada 6 meses y puedes cancelarla en cualquier momento desde los ajustes de tu tienda.</span>
          </li>
          <li className="flex gap-2"><span className="text-brand-aqua mt-0.5">•</span>
            <span><strong className="text-text-primary">Desbloqueo de por vida (pago único), 3,99 € en Android (4,99 € en iPhone):</strong> desbloquea de forma permanente todas las funciones Pro en la cuenta asociada con un único pago. Sin renovación.</span>
          </li>
          <li className="flex gap-2"><span className="text-brand-aqua mt-0.5">•</span>
            <span><strong className="text-text-primary">Founder Pro (primeras 1.000 cuentas, gratuito):</strong> las cuentas registradas antes del 31 de julio de 2026, con una primera sincronización real verificada en los 14 días posteriores al registro, entre las primeras 1.000 en cumplir estos requisitos, reciben acceso Pro de por vida, sin coste alguno, sin fecha de vencimiento y sin compra requerida. El beneficio no está en modo alguno condicionado a dejar reseñas, valoraciones con estrellas u otras acciones promocionales. Las cuentas creadas a partir del 1 de agosto de 2026 no son elegibles para el programa Founder.</span>
          </li>
        </ul>
        <p>Los precios indicados son precios de lanzamiento y podrán aumentar en el futuro para las nuevas compras; el precio aplicable es el que se te muestra en el momento de la compra.</p>
        <p>
          El beneficio Founder Pro permanece activo durante toda la vigencia del Servicio. No puede ser revocado unilateralmente, salvo en caso de violación de estos Términos que conlleve la suspensión de la cuenta. En caso de interrupción completa del Servicio, se aplican las condiciones de la Sección 9 (aviso mínimo de 60 días).
        </p>
        <p>
          Todos los pagos son gestionados por Google y están sujetos a los{" "}
          <a href="https://play.google.com/intl/es/about/play-terms/" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
            Términos de Google Play
          </a>
          . No tenemos acceso a tus datos de pago.
        </p>
      </Section>

      <Section title="7. Derecho de desistimiento (UE)">
        <p>
          Si eres consumidor residente en la Unión Europea, tienes derecho a desistir de la compra
          en un plazo de <strong className="text-text-primary">14 días</strong> sin necesidad de
          indicar ningún motivo (Directiva 2011/83/UE).
        </p>
        <p>
          Para ejercer el desistimiento en compras de Google Play, utiliza el procedimiento oficial
          de reembolso:{" "}
          <a href="https://support.google.com/googleplay/answer/2479637" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
            support.google.com/googleplay/answer/2479637
          </a>
          .
        </p>
        <p>
          <strong className="text-text-primary">Nota:</strong> el derecho de desistimiento se pierde
          si has comenzado a usar las funciones Pro durante esos 14 días y has aceptado
          expresamente la ejecución inmediata en el momento de la compra (cláusula estándar de
          Google Play).
        </p>
      </Section>

      <Section title="8. Disponibilidad del Servicio">
        <p>
          Hacemos todo lo posible para mantener el Servicio disponible las 24 horas del día, los
          7 días de la semana, pero no podemos garantizar un funcionamiento ininterrumpido.
          Tareas de mantenimiento, fallos de hardware o interrupciones de los proveedores pueden
          ocasionar cortes temporales.
        </p>
        <p>
          No somos responsables de las pérdidas ocasionadas por interrupciones del Servicio. Te
          recomendamos no utilizar FitMesh Sync como única copia de seguridad de tus datos de
          salud.
        </p>
      </Section>

      <Section title="9. Cambios en el Servicio">
        <p>
          Podemos modificar, suspender o interrumpir partes del Servicio. Para cambios relevantes
          que afecten a funciones de pago, te avisaremos con al menos 30 días de antelación.
        </p>
        <p>
          En caso de interrupción total del Servicio, te daremos un aviso de al menos 60 días
          para exportar tus datos. Para las suscripciones activas, si el Servicio se cierra, la
          cuota ya pagada se reembolsa de forma proporcional al periodo no utilizado. Las compras
          de por vida se ejecutan íntegramente en el momento del pago y el Founder Pro es gratuito;
          por lo tanto, para estas, no se debe ningún reembolso en caso de cierre del Servicio.
        </p>
      </Section>

      <Section title="10. Limitación de responsabilidad">
        <p>
          En la medida permitida por la ley aplicable, FitMesh Sync se proporciona "tal cual", sin
          garantías expresas ni implícitas. En ningún caso seremos responsables de daños indirectos,
          incidentales, especiales o derivados. Nuestra responsabilidad total hacia ti no podrá
          superar el importe que hayas pagado en los últimos 12 meses.
        </p>
        <p>
          Estas limitaciones no se aplican a los daños causados por nuestra negligencia grave, dolo
          o en los casos en que la ley aplicable no lo permita.
        </p>
      </Section>

      <Section title="11. Propiedad intelectual">
        <p>
          La marca "FitMesh Sync", el logotipo y el diseño de la app y el sitio son de nuestra
          propiedad. Los datos de salud que sincronizas siguen siendo tuyos.
        </p>
      </Section>

      <Section title="12. Resolución de conflictos">
        <p>
          Siempre intentamos resolver cualquier problema de forma amistosa. Puedes contactarnos en{" "}
          <a href="mailto:hello@fitmesh.fit" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">hello@fitmesh.fit</a>
          {": respondemos en un plazo de 30 días."}
        </p>
        <p>
          Los consumidores de la UE también pueden recurrir a la plataforma ODR:{" "}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
            ec.europa.eu/consumers/odr
          </a>
          .
        </p>
      </Section>

      <Section title="13. Ley aplicable y jurisdicción">
        <p>
          Estos Términos se rigen por la ley italiana. Para los consumidores de la UE se mantienen
          las protecciones obligatorias previstas por la ley de su país de residencia. Jurisdicción:
          tribunal del domicilio del consumidor (consumidores de la UE) o Milán (Italia).
        </p>
      </Section>

      <Section title="14. Contacto">
        <div className="rounded-[14px] border border-divider bg-bg-card/60 p-6">
          <TraderIdentity locale="es" showContact={false} className="text-sm" />
          <ul className="mt-3 space-y-1.5 text-sm">
            <li><span className="text-text-muted">Email:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:hello@fitmesh.fit">hello@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Soporte:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:support@fitmesh.fit">support@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Privacidad/Legal:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:privacy@fitmesh.fit">privacy@fitmesh.fit</a></li>
          </ul>
        </div>
      </Section>
    </>
  );
}

function TermsDE() {
  return (
    <>
      <Section title="1. Annahme der Bedingungen">
        <p>
          Diese Nutzungsbedingungen ("Bedingungen") regeln die Nutzung der App FitMesh Sync
          (<em>com.fitmeshsync.app</em>), der Website{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">fitmesh.fit</code>{" "}
          und der damit verbundenen Dienste (zusammen der "Dienst"), bereitgestellt von Matteo Pizzi.
        </p>
        <p>Durch die Nutzung des Dienstes akzeptierst du diese Bedingungen vollständig.</p>
      </Section>

      <Section title="2. Was ist FitMesh Sync">
        <p>
          FitMesh Sync ist eine Anwendung, die Gesundheitsdaten von deinem Android-Gerät ausliest
          (über Health Connect, Samsung Health Data SDK) und sie mit dem von FitMesh verwalteten
          Cloud-Backend (Supabase, EU-Infrastruktur) synchronisiert, sodass du sie in einem
          persönlichen Web-Dashboard einsehen kannst.
        </p>
      </Section>

      <Section title="3. Gesundheitshinweis (WICHTIG)">
        <Callout variant="warning">
          <p>
            <strong className="text-text-primary">FitMesh Sync ist KEIN Medizinprodukt.</strong>{" "}
            Die App stellt keine Diagnosen, Therapien oder medizinischen Empfehlungen bereit und
            ersetzt keinesfalls den Rat einer qualifizierten Ärztin oder eines qualifizierten Arztes.
          </p>
          <p className="mt-3">
            Die angezeigten Daten sind Rohwerte, die von deinem Smartwatch und Health Connect
            geliefert werden: Sie können Fehler, Verzögerungen, fehlende oder anomale Werte
            enthalten. <strong className="text-text-primary">
            Verwende FitMesh Sync nicht für kritische Gesundheitsentscheidungen.</strong>
          </p>
          <p className="mt-3">
            Bei gesundheitlichen Problemen wende dich stets an eine Ärztin oder einen Arzt. Im
            Notfall ruf 112 (EU) oder die lokale Notrufnummer an.
          </p>
        </Callout>
      </Section>

      <Section title="4. Nutzungslizenz">
        <p>
          Wir gewähren dir eine persönliche, nicht ausschließliche, nicht übertragbare und
          widerrufliche Lizenz zur Installation und Nutzung der App auf Android-Geräten, die dir
          gehören oder deiner Kontrolle unterliegen, ausschließlich für den persönlichen Gebrauch.
        </p>
        <p>Du darfst nicht:</p>
        <Forbidden items={[
          "Die App dekompilieren, disassemblieren oder einem Reverse Engineering unterziehen, es sei denn, dies ist gesetzlich ausdrücklich erlaubt",
          "Die App weiterverkaufen, unterlizenzieren oder weiterverbreiten",
          "Den Dienst für illegale Aktivitäten oder zur Verletzung von Rechten Dritter nutzen",
          "Versuchen, auf Daten anderer Nutzer auf unserem öffentlichen Server zuzugreifen",
          "Unsere Server absichtlich mit übermäßigen Anfragen zu überlasten",
        ]} />
      </Section>

      <Section title="5. Konto und Daten">
        <p>
          Für die Nutzung des Dashboards und die Synchronisierung deiner Daten ist ein Konto
          erforderlich: Du meldest dich mit einem E-Mail-Link oder mit Google an
          (Authentifizierung über Supabase Auth). Die Telefon-App verbindet sich über einen
          Kopplungscode mit deinem Konto; jedem Gerät wird eine eindeutige Kennung (Device ID)
          zugewiesen, um die Datenquellen zu unterscheiden.
        </p>
        <p>
          <strong className="text-text-primary">Du bist für deine Daten verantwortlich.</strong>{" "}
          Deine Daten sind an dein Konto gebunden, sodass du das Telefon wechseln kannst, indem
          du es erneut mit demselben Konto verknüpfst. Unser Server wird als Best-Effort-Dienst
          angeboten: Wir garantieren keine Backups, keine dauerhafte Aufbewahrung, und können
          Daten, die seit mehr als 12 Monaten inaktiv sind, nach vorheriger Benachrichtigung
          löschen.
        </p>
        <p>
          Du kannst alle deine Daten im JSON-Format exportieren und die Kontolöschung selbstständig
          im Nutzerbereich beantragen. Die Löschung erfolgt automatisch innerhalb von 24 Stunden
          und entfernt die zugehörigen Daten dauerhaft. Weitere Details findest du in unserer{" "}
          <a href="/de/privacy" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">Datenschutzerklärung</a>.
        </p>
      </Section>

      <Section title="6. In-App-Käufe">
        <p>FitMesh Sync ist ein kostenpflichtiger Dienst. Jede Person erhält eine 14-tägige kostenlose Testphase mit allen Pro-Funktionen (einschließlich der Familien-Mesh mit bis zu 8 Mitgliedern); wer einer Mesh beitritt, erhält seine eigene 14-tägige Testphase. Nach den 14 Tagen erfordert der Zugriff auf die Funktionen einen Kauf: Es gibt keinen dauerhaft kostenlosen Plan. Käufe werden über die Stores abgewickelt (Google Play Billing auf Android, App Store auf iPhone):</p>
        <ul className="space-y-2 mt-3">
          <li className="flex gap-2"><span className="text-brand-aqua mt-0.5">•</span>
            <span><strong className="text-text-primary">Abonnement, 1,19 € alle 6 Monate:</strong> hält alle Pro-Funktionen aktiv, solange das Abonnement läuft. Es verlängert sich automatisch alle 6 Monate und du kannst es jederzeit in den Einstellungen deines Stores kündigen.</span>
          </li>
          <li className="flex gap-2"><span className="text-brand-aqua mt-0.5">•</span>
            <span><strong className="text-text-primary">Lebenslange Freischaltung (Einmalkauf), 3,99 € auf Android (4,99 € auf iPhone):</strong> schaltet mit einer einzigen Zahlung dauerhaft alle Pro-Funktionen für das verknüpfte Konto frei. Keine Verlängerung.</span>
          </li>
          <li className="flex gap-2"><span className="text-brand-aqua mt-0.5">•</span>
            <span><strong className="text-text-primary">Founder Pro (erste 1.000 Konten, kostenlos):</strong> Konten, die bis zum 31. Juli 2026 registriert wurden und eine echte, verifizierte erste Synchronisierung innerhalb von 14 Tagen nach der Registrierung durchgeführt haben, erhalten – sofern sie zu den ersten 1.000 gehören, die diese Voraussetzungen erfüllen – lebenslangen Pro-Zugang ohne Kosten, ohne Ablaufdatum und ohne erforderlichen Kauf. Der Vorteil ist in keiner Weise an das Hinterlassen von Bewertungen, Sternebewertungen oder andere Werbemaßnahmen geknüpft. Ab dem 1. August 2026 erstellte Konten sind nicht für das Founder-Programm berechtigt.</span>
          </li>
        </ul>
        <p>Die angegebenen Preise sind Einführungspreise und können in Zukunft für neue Käufe steigen; es gilt jeweils der Preis, der dir zum Zeitpunkt des Kaufs angezeigt wird.</p>
        <p>
          Der Founder-Pro-Vorteil bleibt für die gesamte Laufzeit des Dienstes aktiv. Er kann nicht einseitig widerrufen werden, außer bei Verstößen gegen diese Nutzungsbedingungen, die zur Kontosperrung führen. Bei vollständiger Einstellung des Dienstes gelten die Bedingungen aus Abschnitt 9 (Mindestankündigung 60 Tage).
        </p>
        <p>
          Alle Zahlungen werden von Google abgewickelt und unterliegen den{" "}
          <a href="https://play.google.com/intl/de/about/play-terms/" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
            Google Play-Nutzungsbedingungen
          </a>
          . Wir haben keinen Zugriff auf deine Zahlungsdaten.
        </p>
      </Section>

      <Section title="7. Widerrufsrecht (EU)">
        <p>
          Wenn du Verbraucher mit Wohnsitz in der Europäischen Union bist, hast du das Recht,
          den Kauf innerhalb von <strong className="text-text-primary">14 Tagen</strong> ohne
          Angabe von Gründen zu widerrufen (EU-Richtlinie 2011/83/EU).
        </p>
        <p>
          Um das Widerrufsrecht bei Google Play-Käufen auszuüben, nutze das offizielle
          Rückerstattungsverfahren:{" "}
          <a href="https://support.google.com/googleplay/answer/2479637" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
            support.google.com/googleplay/answer/2479637
          </a>
          .
        </p>
        <p>
          <strong className="text-text-primary">Hinweis:</strong> Das Widerrufsrecht erlischt,
          wenn du innerhalb der 14 Tage begonnen hast, die Pro-Funktionen zu nutzen, und der
          sofortigen Ausführung ausdrücklich zugestimmt hast (Standard-Klausel von Google Play).
        </p>
      </Section>

      <Section title="8. Verfügbarkeit des Dienstes">
        <p>
          Wir bemühen uns, den Dienst rund um die Uhr verfügbar zu halten, können jedoch keinen
          ununterbrochenen Betrieb garantieren. Wartungsarbeiten, Hardwareausfälle oder Ausfälle
          von Anbietern können zu vorübergehenden Unterbrechungen führen.
        </p>
        <p>
          Wir haften nicht für Verluste, die durch Unterbrechungen entstehen. Wir empfehlen,
          FitMesh Sync nicht als einziges Backup deiner Gesundheitsdaten zu verwenden.
        </p>
      </Section>

      <Section title="9. Änderungen am Dienst">
        <p>
          Wir können Teile des Dienstes ändern, aussetzen oder einstellen. Bei wesentlichen
          Änderungen, die kostenpflichtige Funktionen betreffen, werden wir dich mit mindestens
          30 Tagen Vorankündigung informieren.
        </p>
        <p>
          Bei vollständiger Einstellung des Dienstes geben wir mindestens 60 Tage Vorankündigung,
          damit du deine Daten exportieren kannst. Bei aktiven Abonnements wird die bereits
          gezahlte Gebühr im Falle einer Einstellung des Dienstes anteilig für den nicht genutzten
          Zeitraum erstattet. Lebenslange Käufe sind mit der Zahlung vollständig erfüllt und Founder
          Pro ist kostenlos; daher ist hierfür bei einer Einstellung des Dienstes keine Rückerstattung geschuldet.
        </p>
      </Section>

      <Section title="10. Haftungsbeschränkung">
        <p>
          Im gesetzlich zulässigen Umfang wird FitMesh Sync "wie besehen" ohne ausdrückliche oder
          stillschweigende Gewährleistungen bereitgestellt. Wir haften in keinem Fall für
          mittelbare, zufällige, besondere oder Folgeschäden. Unsere Gesamthaftung dir gegenüber
          ist auf den Betrag begrenzt, den du in den letzten 12 Monaten gezahlt hast.
        </p>
        <p>
          Diese Beschränkungen gelten nicht für Schäden, die durch grobe Fahrlässigkeit oder
          Vorsatz verursacht wurden, oder in Fällen, in denen das anwendbare Recht dies nicht
          zulässt.
        </p>
      </Section>

      <Section title="11. Geistiges Eigentum">
        <p>
          Die Marke "FitMesh Sync", das Logo sowie das Design der App und der Website sind unser
          Eigentum. Die Gesundheitsdaten, die du synchronisierst, bleiben dein Eigentum.
        </p>
      </Section>

      <Section title="12. Streitbeilegung">
        <p>
          Wir versuchen stets, Streitigkeiten auf informellem Wege beizulegen. Kontaktiere uns
          unter{" "}
          <a href="mailto:hello@fitmesh.fit" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">hello@fitmesh.fit</a>
          {": Wir antworten innerhalb von 30 Tagen."}
        </p>
        <p>
          EU-Verbraucher können auch die OS-Plattform nutzen:{" "}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
            ec.europa.eu/consumers/odr
          </a>
          .
        </p>
      </Section>

      <Section title="13. Anwendbares Recht und Gerichtsstand">
        <p>
          Diese Bedingungen unterliegen dem italienischen Recht. Für EU-Verbraucher bleiben die
          zwingenden Schutzvorschriften des Rechts ihres Wohnsitzlandes anwendbar. Gerichtsstand:
          Gericht am Wohnsitz des Verbrauchers (EU-Verbraucher) oder Mailand (Italien).
        </p>
      </Section>

      <Section title="14. Kontakt">
        <div className="rounded-[14px] border border-divider bg-bg-card/60 p-6">
          <TraderIdentity locale="de" showContact={false} className="text-sm" />
          <ul className="mt-3 space-y-1.5 text-sm">
            <li><span className="text-text-muted">E-Mail:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:hello@fitmesh.fit">hello@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Support:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:support@fitmesh.fit">support@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Datenschutz/Rechtliches:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:privacy@fitmesh.fit">privacy@fitmesh.fit</a></li>
          </ul>
        </div>
      </Section>
    </>
  );
}

function TermsPT() {
  return (
    <>
      <Section title="1. Aceitação dos termos">
        <p>
          Estes Termos de Serviço ("Termos") regem o uso do aplicativo FitMesh Sync
          (<em>com.fitmeshsync.app</em>), do site{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">fitmesh.fit</code>{" "}
          e dos serviços relacionados (coletivamente, o "Serviço"), fornecidos por Matteo Pizzi.
        </p>
        <p>Ao usar o Serviço, você aceita integralmente estes Termos.</p>
      </Section>

      <Section title="2. O que é o FitMesh Sync">
        <p>
          FitMesh Sync é um aplicativo que lê dados de saúde do seu dispositivo Android (por meio
          do Health Connect e do Samsung Health Data SDK) e os sincroniza com o backend em nuvem
          gerenciado pela FitMesh (Supabase, infraestrutura na UE), permitindo que você os
          visualize em um painel web pessoal.
        </p>
      </Section>

      <Section title="3. Aviso sobre saúde (IMPORTANTE)">
        <Callout variant="warning">
          <p>
            <strong className="text-text-primary">FitMesh Sync NÃO é um dispositivo médico.</strong>{" "}
            Não fornece diagnósticos, terapias, recomendações médicas nem substitui, de forma
            alguma, a opinião de um profissional de saúde qualificado.
          </p>
          <p className="mt-3">
            Os dados exibidos são valores brutos fornecidos pelo seu smartwatch e pelo Health
            Connect: podem conter erros, atrasos, valores ausentes ou anômalos.{" "}
            <strong className="text-text-primary">
              Não use o FitMesh Sync para tomar decisões críticas de saúde.
            </strong>
          </p>
          <p className="mt-3">
            Para problemas de saúde, consulte sempre um médico. Em caso de emergência, ligue para
            192 (SAMU, Brasil) ou para o número de emergência local.
          </p>
        </Callout>
      </Section>

      <Section title="4. Licença de uso">
        <p>
          Concedemos a você uma licença pessoal, não exclusiva, intransferível e revogável para
          instalar e usar o aplicativo nos dispositivos Android de sua propriedade ou sob seu
          controle, exclusivamente para uso pessoal.
        </p>
        <p>Você não pode:</p>
        <Forbidden items={[
          "Descompilar, desmontar ou realizar engenharia reversa do aplicativo, exceto nos limites permitidos por lei",
          "Revender, sublicenciar ou redistribuir o aplicativo",
          "Usar o Serviço para atividades ilegais ou para violar direitos de terceiros",
          "Tentar acessar dados de outros usuários em nosso servidor público",
          "Sobrecarregar deliberadamente nossos servidores com requisições excessivas",
        ]} />
      </Section>

      <Section title="5. Conta e dados">
        <p>
          Para usar o painel e sincronizar seus dados, é necessária uma conta: você entra com um
          link por e-mail ou com o Google (autenticação gerenciada pelo Supabase Auth). O
          aplicativo no celular se conecta à sua conta por meio de um código de emparelhamento;
          cada dispositivo possui um identificador único (Device ID) usado para distinguir as
          fontes de dados.
        </p>
        <p>
          <strong className="text-text-primary">Você é o responsável pelos seus dados.</strong>{" "}
          Os dados estão vinculados à sua conta, portanto você pode trocar de celular
          reconectando-o à mesma conta. Nosso servidor é oferecido como serviço de melhor esforço
          (best-effort): não garantimos backups, não garantimos retenção permanente, e podemos
          excluir dados inativos há mais de 12 meses mediante aviso prévio.
        </p>
        <p>
          Você pode exportar todos os seus dados em formato JSON e solicitar a exclusão da conta
          diretamente na área do usuário. A exclusão é executada automaticamente em até 24 horas e
          remove permanentemente os dados associados. Mais detalhes em nossa{" "}
          <a href="/pt/privacy" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">Política de Privacidade</a>.
        </p>
      </Section>

      <Section title="6. Compras no aplicativo">
        <p>O FitMesh Sync é um serviço pago. Cada pessoa tem direito a um período de avaliação gratuito de 14 dias com todas as funcionalidades Pro ativas (incluindo a Mesh Família de até 8 membros); quem entra em uma Mesh tem o seu próprio período de 14 dias. Após os 14 dias, o acesso às funcionalidades exige uma compra: não existe um plano gratuito permanente. As compras são gerenciadas pelas lojas (Google Play Billing no Android, App Store no iPhone):</p>
        <ul className="space-y-2 mt-3">
          <li className="flex gap-2"><span className="text-brand-aqua mt-0.5">•</span>
            <span><strong className="text-text-primary">Assinatura, €1,19 a cada 6 meses:</strong> mantém todas as funcionalidades Pro ativas enquanto a assinatura estiver vigente. Renova-se automaticamente a cada 6 meses e você pode cancelá-la a qualquer momento nas configurações da sua loja.</span>
          </li>
          <li className="flex gap-2"><span className="text-brand-aqua mt-0.5">•</span>
            <span><strong className="text-text-primary">Desbloqueio vitalício (compra única), €3,99 no Android (€4,99 no iPhone):</strong> desbloqueia permanentemente todas as funcionalidades Pro na conta associada com um único pagamento. Sem renovação.</span>
          </li>
          <li className="flex gap-2"><span className="text-brand-aqua mt-0.5">•</span>
            <span><strong className="text-text-primary">Founder Pro (primeiras 1.000 contas, gratuito):</strong> contas registradas até 31 de julho de 2026, com uma primeira sincronização real verificada em até 14 dias após o registo, entre as primeiras 1.000 a cumprir estes requisitos, recebem acesso Pro vitalício, sem qualquer custo, sem data de expiração e sem compra necessária. O benefício não está de forma alguma condicionado à publicação de avaliações, classificações por estrelas ou outras ações promocionais. Contas criadas a partir de 1 de agosto de 2026 não são elegíveis para o programa Founder.</span>
          </li>
        </ul>
        <p>Os preços indicados são preços de lançamento e poderão aumentar no futuro para novas compras; o preço aplicável é aquele exibido a você no momento da compra.</p>
        <p>
          O benefício Founder Pro permanece ativo durante toda a vigência do Serviço. Não pode ser revogado unilateralmente, exceto em caso de violação destes Termos que resulte na suspensão da conta. Em caso de encerramento completo do Serviço, aplicam-se as condições da Seção 9 (aviso mínimo de 60 dias).
        </p>
        <p>
          Todos os pagamentos são gerenciados pelo Google e estão sujeitos aos{" "}
          <a href="https://play.google.com/intl/pt/about/play-terms/" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
            Termos do Google Play
          </a>
          . Não temos acesso aos seus dados de pagamento.
        </p>
      </Section>

      <Section title="7. Direito de arrependimento (UE)">
        <p>
          Se você for consumidor residente na União Europeia, tem o direito de desistir da compra
          no prazo de <strong className="text-text-primary">14 dias</strong> sem precisar indicar
          qualquer motivo (Diretiva 2011/83/UE).
        </p>
        <p>
          Para exercer o direito de arrependimento em compras do Google Play, utilize o
          procedimento oficial de reembolso:{" "}
          <a href="https://support.google.com/googleplay/answer/2479637" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
            support.google.com/googleplay/answer/2479637
          </a>
          .
        </p>
        <p>
          <strong className="text-text-primary">Observação:</strong> o direito de arrependimento é
          perdido caso você tenha começado a usar as funcionalidades Pro durante esses 14 dias e
          tenha aceitado expressamente a execução imediata no momento da compra (cláusula padrão
          do Google Play).
        </p>
      </Section>

      <Section title="8. Disponibilidade do Serviço">
        <p>
          Fazemos o máximo para manter o Serviço disponível 24 horas por dia, 7 dias por semana,
          mas não podemos garantir funcionamento ininterrupto. Manutenções, falhas de hardware ou
          interrupções de provedores podem causar indisponibilidades temporárias.
        </p>
        <p>
          Não somos responsáveis por perdas causadas por interrupções. Recomendamos não usar o
          FitMesh Sync como único backup dos seus dados de saúde.
        </p>
      </Section>

      <Section title="9. Alterações no Serviço">
        <p>
          Podemos modificar, suspender ou encerrar partes do Serviço. Para alterações relevantes
          que afetem funcionalidades pagas, você será notificado com antecedência mínima de 30 dias.
        </p>
        <p>
          Em caso de encerramento completo do Serviço, forneceremos um aviso de pelo menos 60 dias
          para você exportar seus dados. Para as assinaturas ativas, em caso de encerramento do
          Serviço, o valor já pago é reembolsado proporcionalmente ao período não utilizado. As
          compras vitalícias são totalmente executadas no momento do pagamento e o Founder Pro é
          gratuito; portanto, para estas, nenhum reembolso é devido em caso de encerramento do Serviço.
        </p>
      </Section>

      <Section title="10. Limitação de responsabilidade">
        <p>
          Nos limites permitidos pela legislação aplicável, o FitMesh Sync é fornecido "no estado
          em que se encontra", sem garantias expressas ou implícitas. Em nenhuma circunstância
          seremos responsáveis por danos indiretos, incidentais, especiais ou consequentes. Nossa
          responsabilidade total perante você não poderá exceder o valor pago nos últimos 12 meses.
        </p>
        <p>
          Estas limitações não se aplicam a danos causados por nossa negligência grave, dolo ou
          nos casos em que a legislação aplicável não o permita.
        </p>
      </Section>

      <Section title="11. Propriedade intelectual">
        <p>
          A marca "FitMesh Sync", o logotipo e o design do aplicativo e do site são de nossa
          propriedade. Os dados de saúde que você sincroniza permanecem de sua propriedade.
        </p>
      </Section>

      <Section title="12. Resolução de conflitos">
        <p>
          Buscamos sempre resolver os problemas de forma amigável. Entre em contato conosco pelo{" "}
          <a href="mailto:hello@fitmesh.fit" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">hello@fitmesh.fit</a>
          {": respondemos em até 30 dias."}
        </p>
        <p>
          Consumidores da UE também podem recorrer à plataforma ODR:{" "}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
            ec.europa.eu/consumers/odr
          </a>
          .
        </p>
      </Section>

      <Section title="13. Lei aplicável e foro competente">
        <p>
          Estes Termos são regidos pela legislação italiana. Para consumidores da UE, mantêm-se
          aplicáveis as proteções obrigatórias previstas na lei do país de residência. Foro
          competente: foro do domicílio do consumidor (consumidores da UE) ou Milão (Itália).
        </p>
      </Section>

      <Section title="14. Contato">
        <div className="rounded-[14px] border border-divider bg-bg-card/60 p-6">
          <TraderIdentity locale="pt" showContact={false} className="text-sm" />
          <ul className="mt-3 space-y-1.5 text-sm">
            <li><span className="text-text-muted">E-mail:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:hello@fitmesh.fit">hello@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Suporte:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:support@fitmesh.fit">support@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Privacidade/Jurídico:</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:privacy@fitmesh.fit">privacy@fitmesh.fit</a></li>
          </ul>
        </div>
      </Section>
    </>
  );
}

function TermsFR() {
  return (
    <>
      <Section title="1. Acceptation des conditions">
        <p>
          Les présentes Conditions d'utilisation ("Conditions") régissent l'utilisation de
          l'application FitMesh Sync (<em>com.fitmeshsync.app</em>), du site{" "}
          <code className="text-brand-aqua font-mono text-[0.85em]">fitmesh.fit</code>{" "}
          et des services associés (collectivement, le "Service"), fournis par Matteo Pizzi.
        </p>
        <p>En utilisant le Service, vous acceptez pleinement ces Conditions.</p>
      </Section>

      <Section title="2. Qu'est-ce que FitMesh Sync">
        <p>
          FitMesh Sync est une application qui lit les données de santé de votre appareil Android
          (via Health Connect et le Samsung Health Data SDK) et les synchronise avec le backend
          cloud géré par FitMesh (Supabase, infrastructure UE), vous permettant de les consulter
          dans un tableau de bord web personnel.
        </p>
      </Section>

      <Section title="3. Avertissement santé (IMPORTANT)">
        <Callout variant="warning">
          <p>
            <strong className="text-text-primary">FitMesh Sync N'est PAS un dispositif médical.</strong>{" "}
            Il ne fournit pas de diagnostics, de thérapies, de recommandations médicales et ne
            remplace en aucun cas l'avis d'un professionnel de santé qualifié.
          </p>
          <p className="mt-3">
            Les données affichées sont des valeurs brutes fournies par votre montre connectée et
            Health Connect : elles peuvent contenir des erreurs, des délais, des valeurs manquantes
            ou anormales. <strong className="text-text-primary">
            N'utilisez pas FitMesh Sync pour des décisions critiques concernant votre santé.</strong>
          </p>
          <p className="mt-3">
            En cas de problème de santé, consultez toujours un médecin. En cas d'urgence, appelez
            le 15 (SAMU, France), le 112 (UE) ou le numéro d'urgence local.
          </p>
        </Callout>
      </Section>

      <Section title="4. Licence d'utilisation">
        <p>
          Nous vous accordons une licence personnelle, non exclusive, non transférable et révocable
          pour installer et utiliser l'application sur les appareils Android que vous possédez ou
          contrôlez, à des fins exclusivement personnelles.
        </p>
        <p>Vous ne pouvez pas :</p>
        <Forbidden items={[
          "Décompiler, désassembler ou procéder à une rétro-ingénierie de l'application, sauf dans les limites autorisées par la loi",
          "Revendre, sous-licencier ou redistribuer l'application",
          "Utiliser le Service à des fins illégales ou pour porter atteinte aux droits de tiers",
          "Tenter d'accéder aux données d'autres utilisateurs sur notre serveur public",
          "Surcharger délibérément nos serveurs avec des requêtes excessives",
        ]} />
      </Section>

      <Section title="5. Compte et données">
        <p>
          Pour utiliser le tableau de bord et synchroniser vos données, un compte est nécessaire :
          vous vous connectez avec un lien par e-mail ou avec Google (authentification gérée par
          Supabase Auth). L'application sur le téléphone se connecte à votre compte via un code
          d'appairage ; chaque appareil reçoit un identifiant unique (Device ID) permettant de
          distinguer les sources de données.
        </p>
        <p>
          <strong className="text-text-primary">Vous êtes responsable de vos données.</strong>{" "}
          Vos données sont liées à votre compte, ce qui vous permet de changer de téléphone en le
          reconnectant au même compte. Notre serveur est proposé en mode "meilleur effort"
          (best-effort) : nous ne garantissons ni les sauvegardes, ni la conservation permanente
          des données, et pouvons supprimer des données inactives depuis plus de 12 mois après
          notification préalable.
        </p>
        <p>
          Vous pouvez exporter toutes vos données au format JSON et demander la suppression de
          votre compte directement depuis l'espace utilisateur. La suppression est effectuée
          automatiquement dans les 24 heures et efface définitivement les données associées. Plus
          de détails dans notre{" "}
          <a href="/fr/privacy" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">Politique de confidentialité</a>.
        </p>
      </Section>

      <Section title="6. Achats intégrés">
        <p>FitMesh Sync est un service payant. Chaque personne bénéficie d'une période d'essai gratuite de 14 jours avec toutes les fonctionnalités Pro actives (y compris la Mesh Famille jusqu'à 8 membres) ; toute personne qui rejoint une Mesh dispose de sa propre période d'essai de 14 jours. Au terme des 14 jours, l'accès aux fonctionnalités nécessite un achat : il n'existe pas de formule gratuite permanente. Les achats sont gérés via les stores (Google Play Billing sur Android, App Store sur iPhone) :</p>
        <ul className="space-y-2 mt-3">
          <li className="flex gap-2"><span className="text-brand-aqua mt-0.5">•</span>
            <span><strong className="text-text-primary">Abonnement, 1,19 € tous les 6 mois :</strong> maintient toutes les fonctionnalités Pro actives tant que l'abonnement est en cours. Il se renouvelle automatiquement tous les 6 mois et vous pouvez le résilier à tout moment depuis les paramètres de votre store.</span>
          </li>
          <li className="flex gap-2"><span className="text-brand-aqua mt-0.5">•</span>
            <span><strong className="text-text-primary">Déblocage à vie (achat unique), 3,99 € sur Android (4,99 € sur iPhone) :</strong> débloque définitivement toutes les fonctionnalités Pro sur le compte associé avec un paiement unique. Aucun renouvellement.</span>
          </li>
          <li className="flex gap-2"><span className="text-brand-aqua mt-0.5">•</span>
            <span><strong className="text-text-primary">Founder Pro (1 000 premiers comptes, gratuit) :</strong> les comptes enregistrés avant le 31 juillet 2026, avec une première synchronisation réelle vérifiée dans les 14 jours suivant l'inscription, parmi les 1 000 premiers à remplir ces conditions, bénéficient d'un accès Pro à vie, sans frais, sans date d'expiration et sans achat requis. Cet avantage n'est en aucun cas conditionné à la publication d'avis, de notations par étoiles ou à toute autre action promotionnelle. Les comptes créés à partir du 1er août 2026 ne sont pas éligibles au programme Founder.</span>
          </li>
        </ul>
        <p>Les prix indiqués sont des prix de lancement et pourront augmenter à l'avenir pour les nouveaux achats ; le prix applicable est celui qui vous est affiché au moment de l'achat.</p>
        <p>
          Le bénéfice Founder Pro reste actif pendant toute la durée du Service. Il ne peut pas être révoqué unilatéralement, sauf en cas de violation des présentes Conditions entraînant la suspension du compte. En cas d'arrêt complet du Service, les conditions de la Section 9 s'appliquent (préavis minimum de 60 jours).
        </p>
        <p>
          Tous les paiements sont gérés par Google et soumis aux{" "}
          <a href="https://play.google.com/intl/fr/about/play-terms/" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
            Conditions Google Play
          </a>
          . Nous n'avons pas accès à vos données de paiement.
        </p>
      </Section>

      <Section title="7. Droit de rétractation (UE)">
        <p>
          Si vous êtes un consommateur résidant dans l'Union européenne, vous avez le droit de
          vous rétracter de l'achat dans un délai de{" "}
          <strong className="text-text-primary">14 jours</strong> sans avoir à motiver votre
          décision (Directive 2011/83/UE).
        </p>
        <p>
          Pour exercer votre droit de rétractation sur les achats Google Play, utilisez la
          procédure officielle de remboursement :{" "}
          <a href="https://support.google.com/googleplay/answer/2479637" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
            support.google.com/googleplay/answer/2479637
          </a>
          .
        </p>
        <p>
          <strong className="text-text-primary">Remarque :</strong> le droit de rétractation est
          perdu si vous avez commencé à utiliser les fonctionnalités Pro durant ces 14 jours et
          avez expressément accepté l'exécution immédiate au moment de l'achat (clause standard
          Google Play).
        </p>
      </Section>

      <Section title="8. Disponibilité du Service">
        <p>
          Nous faisons tout notre possible pour maintenir le Service disponible 24h/24, 7j/7, mais
          nous ne pouvons pas en garantir le fonctionnement ininterrompu. Des opérations de
          maintenance, des défaillances matérielles ou des interruptions chez nos fournisseurs
          peuvent provoquer des coupures temporaires.
        </p>
        <p>
          Nous ne sommes pas responsables des pertes occasionnées par des interruptions de service.
          Nous vous déconseillons d'utiliser FitMesh Sync comme unique sauvegarde de vos données
          de santé.
        </p>
      </Section>

      <Section title="9. Modifications du Service">
        <p>
          Nous pouvons modifier, suspendre ou interrompre des parties du Service. Pour les
          modifications importantes affectant des fonctionnalités payantes, nous vous en
          informerons avec un préavis d'au moins 30 jours.
        </p>
        <p>
          En cas d'interruption complète du Service, nous vous accorderons un préavis d'au moins
          60 jours pour exporter vos données. Pour les abonnements actifs, en cas d'arrêt du
          Service, la somme déjà versée est remboursée au prorata de la période non utilisée. Les
          achats à vie sont entièrement exécutés au moment du paiement et le Founder Pro est
          gratuit ; aucun remboursement n'est donc dû, pour ceux-ci, en cas d'arrêt du Service.
        </p>
      </Section>

      <Section title="10. Limitation de responsabilité">
        <p>
          Dans les limites autorisées par la loi applicable, FitMesh Sync est fourni "en l'état",
          sans garantie expresse ou implicite. En aucun cas nous ne serons responsables de
          dommages indirects, accessoires, spéciaux ou consécutifs. Notre responsabilité totale
          envers vous ne pourra excéder le montant que vous avez payé au cours des 12 derniers mois.
        </p>
        <p>
          Ces limitations ne s'appliquent pas aux dommages causés par notre négligence grave, notre
          faute intentionnelle, ou dans les cas où la loi applicable ne le permet pas.
        </p>
      </Section>

      <Section title="11. Propriété intellectuelle">
        <p>
          La marque "FitMesh Sync", le logo ainsi que le design de l'application et du site sont
          notre propriété. Les données de santé que vous synchronisez restent votre propriété.
        </p>
      </Section>

      <Section title="12. Résolution des litiges">
        <p>
          Nous cherchons toujours à résoudre les litiges à l'amiable. Contactez-nous à l'adresse{" "}
          <a href="mailto:hello@fitmesh.fit" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">hello@fitmesh.fit</a>
          {" : nous répondons dans un délai de 30 jours."}
        </p>
        <p>
          Les consommateurs de l'UE peuvent également recourir à la plateforme RLL :{" "}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener" className="text-brand-aqua hover:text-brand-blue underline underline-offset-4">
            ec.europa.eu/consumers/odr
          </a>
          .
        </p>
      </Section>

      <Section title="13. Loi applicable et juridiction compétente">
        <p>
          Les présentes Conditions sont régies par le droit italien. Pour les consommateurs de
          l'UE, les protections obligatoires prévues par la loi de leur pays de résidence restent
          applicables. Juridiction compétente : tribunal du domicile du consommateur (consommateurs
          de l'UE) ou Milan (Italie).
        </p>
      </Section>

      <Section title="14. Contact">
        <div className="rounded-[14px] border border-divider bg-bg-card/60 p-6">
          <TraderIdentity locale="fr" showContact={false} className="text-sm" />
          <ul className="mt-3 space-y-1.5 text-sm">
            <li><span className="text-text-muted">E-mail :</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:hello@fitmesh.fit">hello@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Assistance :</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:support@fitmesh.fit">support@fitmesh.fit</a></li>
            <li><span className="text-text-muted">Confidentialité/Juridique :</span> <a className="text-brand-aqua hover:text-brand-blue" href="mailto:privacy@fitmesh.fit">privacy@fitmesh.fit</a></li>
          </ul>
        </div>
      </Section>
    </>
  );
}
